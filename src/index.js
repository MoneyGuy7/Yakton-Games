// Serves everything in /public, relays chess and two-player games (Room), relays Heli Royale lobbies of up to 8 pilots (Arena),
// keeps the downtime switch and login throttle (SiteState), runs the admin API, adds security headers.
// The admin password is the ADMIN_PASSWORD worker secret/variable (Cloudflare dashboard > Settings > Variables and Secrets).
export class Room {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(req) {
    if (req.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket", { status: 426 });
    const [client, server] = Object.values(new WebSocketPair());
    const live = this.ctx.getWebSockets();
    if (live.length >= 2) {
      server.accept();
      server.send(JSON.stringify({ t: "full" }));
      server.close(1000, "full");
      return new Response(null, { status: 101, webSocket: client });
    }
    const taken = live.flatMap((w) => this.ctx.getTags(w));
    const tag = taken.includes("w") ? "b" : "w";
    this.ctx.acceptWebSocket(server, [tag]);
    server.send(JSON.stringify({ t: "hello", c: tag === "w" ? 1 : -1, n: live.length + 1 }));
    live.forEach((w) => w.send(JSON.stringify({ t: "join" })));
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(ws, msg) {
    this.ctx.getWebSockets().forEach((w) => { if (w !== ws) w.send(msg); });
  }
  webSocketClose(ws) {
    this.ctx.getWebSockets().forEach((w) => { if (w !== ws) w.send('{"t":"left"}'); });
  }
}

// Heli Royale lobby: up to 8 pilots per room code. The first pilot in is the host.
// The server only relays. It stamps each message with the sender id (i), keeps track of the host,
// and refuses new pilots once the host has started a match.
export class Arena {
  constructor(ctx) {
    this.ctx = ctx;
    this.started = false;
    ctx.blockConcurrencyWhile(async () => { this.started = (await ctx.storage.get("started")) === true; });
  }
  info(ws) { return ws.deserializeAttachment() || {}; }
  setStarted(v) { if (this.started !== v) { this.started = v; this.ctx.storage.put("started", v); } }
  async fetch(req) {
    if (req.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket", { status: 426 });
    const [client, server] = Object.values(new WebSocketPair());
    const live = this.ctx.getWebSockets();
    if (live.length === 0) this.setStarted(false);
    const refuse = (t) => { server.accept(); server.send(JSON.stringify({ t })); server.close(1000, t); return new Response(null, { status: 101, webSocket: client }); };
    if (live.length >= 8) return refuse("full");
    if (this.started) return refuse("busy");
    const id = "p" + Math.random().toString(36).slice(2, 8);
    const host = live.length === 0;
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ id, host });
    server.send(JSON.stringify({ t: "hello", id, host }));
    live.forEach((w) => w.send(JSON.stringify({ t: "join", id })));
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(ws, raw) {
    if (typeof raw !== "string" || raw.length > 4000) return;
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== "string") return;
    const me = this.info(ws);
    if ((m.t === "start" || m.t === "lobby" || m.t === "snap") && !me.host) return;
    if (m.t === "start") this.setStarted(true);
    if (m.t === "lobby") this.setStarted(false);
    m.i = me.id;
    const to = m.to;
    delete m.to;
    const out = JSON.stringify(m);
    for (const w of this.ctx.getWebSockets()) {
      if (w === ws) continue;
      if (to && this.info(w).id !== to) continue;
      w.send(out);
    }
  }
  webSocketClose(ws) {
    const me = this.info(ws);
    const rest = this.ctx.getWebSockets().filter((w) => w !== ws);
    if (rest.length === 0) { this.setStarted(false); return; }
    rest.forEach((w) => w.send(JSON.stringify({ t: "left", id: me.id, host: !!me.host })));
    if (me.host) {
      const next = rest[0];
      next.serializeAttachment({ ...this.info(next), host: true });
      next.send(JSON.stringify({ t: "host" }));
    }
  }
  webSocketError(ws) { this.webSocketClose(ws); }
}

// Holds the downtime switch and counts failed admin logins per IP. One instance, named "site".
export class SiteState {
  constructor(ctx) { this.ctx = ctx; }
  async fetch(req) {
    const u = new URL(req.url), s = this.ctx.storage;
    const json = (o) => new Response(JSON.stringify(o), { headers: { "Content-Type": "application/json" } });
    if (u.pathname === "/get") return json({ down: (await s.get("down")) === true, message: (await s.get("message")) || "" });
    if (u.pathname === "/set") {
      const b = await req.json();
      await s.put({ down: b.down === true, message: String(b.message || "").slice(0, 200) });
      return json({ ok: true });
    }
    if (u.pathname === "/throttle") {
      const key = "t:" + (u.searchParams.get("ip") || "x"), op = u.searchParams.get("op"), now = Date.now();
      let t = (await s.get(key)) || { n: 0, until: 0 };
      if (op === "clear") { await s.delete(key); return json({ locked: false }); }
      if (op === "fail") {
        t.n++;
        if (t.n >= 5) { t = { n: 0, until: now + 5 * 60 * 1000 }; }
        await s.put(key, t);
      }
      return json({ locked: t.until > now, retry: Math.max(0, Math.ceil((t.until - now) / 1000)) });
    }
    if (u.pathname === "/notice-get") return json((await s.get("notice")) || { on: true, v: 1, text: "This site is still being worked on. Games may have bugs, and your saved progress may be reset." });
    if (u.pathname === "/notice-set") { const b = await req.json(); await s.put("notice", { on: b.on === true, text: String(b.text || "").slice(0, 1000), v: Date.now() }); return json({ ok: true }); }
    if (u.pathname === "/notice-raw") { const b = await req.json(); await s.put("notice", { on: b.on === true, text: String(b.text || "").slice(0, 1000), v: b.v }); return json({ ok: true }); }
    // Feedback: stored as fb:<time>:<rand>. Max 2000 entries, 5 per IP per 10 minutes.
    if (u.pathname === "/fb-add") {
      const b = await req.json(), now = Date.now(), rk = "fr:" + (b.ip || "x");
      let r = (await s.get(rk)) || { n: 0, t: now };
      if (now - r.t > 600000) r = { n: 0, t: now };
      if (r.n >= 5) return json({ ok: false, error: "You have sent a lot of feedback. Please try again in a few minutes." });
      const count = (await s.list({ prefix: "fb:", limit: 2001 })).size;
      if (count >= 2000) return json({ ok: false, error: "Feedback inbox is full right now." });
      r.n++; await s.put(rk, r);
      const id = "fb:" + String(now).padStart(14, "0") + ":" + Math.random().toString(36).slice(2, 7);
      await s.put(id, { game: b.game, gameId: b.gameId, name: b.name, text: b.text, time: now });
      return json({ ok: true });
    }
    if (u.pathname === "/fb-list") {
      const m = await s.list({ prefix: "fb:", reverse: true, limit: 2000 });
      return json({ items: [...m].map(([id, v]) => ({ id, ...v })) });
    }
    if (u.pathname === "/fb-del") { await s.delete((await req.json()).id); return json({ ok: true }); }
    if (u.pathname === "/fb-clear") { const m = await s.list({ prefix: "fb:" }); await s.delete([...m.keys()].slice(0, 128)); if (m.size > 128) await s.delete([...m.keys()].slice(128, 256)); return json({ ok: true, left: Math.max(0, m.size - 256) }); }
    return new Response("Not found", { status: 404 });
  }
}

const TTL = 12 * 3600; // admin login lasts 12 hours
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}
const safeEq = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
async function passwordOk(env, given) {
  if (!env.ADMIN_PASSWORD) return false;
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(String(given))), crypto.subtle.digest("SHA-256", enc.encode(String(env.ADMIN_PASSWORD)))]);
  return safeEq(hex(a), hex(b));
}
async function isAdmin(req, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const m = /(?:^|;\s*)yk_admin=([^;]+)/.exec(req.headers.get("Cookie") || "");
  if (!m) return false;
  const [exp, sig] = m[1].split(".");
  if (!exp || !sig || +exp < Date.now() / 1000) return false;
  return safeEq(sig, await hmac(env.ADMIN_PASSWORD, "admin." + exp));
}
const siteDO = (env) => env.STATE.get(env.STATE.idFromName("site"));
let cache = { t: 0, v: { down: false, message: "" } };
async function getStatus(env) {
  if (Date.now() - cache.t < 5000) return cache.v;
  try {
    const r = await siteDO(env).fetch("https://state/get");
    cache = { t: Date.now(), v: await r.json() };
  } catch { /* keep the last known state */ }
  return cache.v;
}
const jres = (o, status = 200, extra = {}) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra } });
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function api(request, env, url) {
  const p = url.pathname, post = request.method === "POST";
  if (p === "/api/status") {
    const s = await getStatus(env);
    return jres({ down: s.down, message: s.message, bypass: s.down ? await isAdmin(request, env) : false });
  }
  if (p === "/api/notice" && !post) return jres(await (await siteDO(env).fetch("https://state/notice-get")).json());
  if (p === "/api/admin/me") return jres({ admin: await isAdmin(request, env), configured: !!env.ADMIN_PASSWORD });
  if (p === "/api/admin/feedback" && !post) {
    if (!(await isAdmin(request, env))) return jres({ error: "Not logged in" }, 401);
    return jres(await (await siteDO(env).fetch("https://state/fb-list")).json());
  }
  if (!post) return jres({ error: "Not found" }, 404);
  // Admin writes must come from this site and be JSON (blocks cross-site form posts).
  const origin = request.headers.get("Origin");
  if ((origin && origin !== url.origin) || !(request.headers.get("Content-Type") || "").includes("application/json")) return jres({ error: "Bad request" }, 400);
  let body = {};
  try { body = await request.json(); } catch { /* empty body is fine for logout */ }

  if (p === "/api/feedback") {
    const clean = (t, n) => String(t || "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, n);
    const text = clean(body.text, 1000);
    if (text.length < 2) return jres({ error: "Please write a little feedback first." }, 400);
    const ip = request.headers.get("CF-Connecting-IP") || "x";
    const r = await (await siteDO(env).fetch("https://state/fb-add", { method: "POST", body: JSON.stringify({ ip, game: clean(body.game, 60) || "General", gameId: clean(body.gameId, 30), name: clean(body.name, 40), text }) })).json();
    return r.ok ? jres({ ok: true }) : jres({ error: r.error }, 429);
  }
  if (p === "/api/admin/feedback/delete" || p === "/api/admin/feedback/clear") {
    if (!(await isAdmin(request, env))) return jres({ error: "Not logged in" }, 401);
    const clear = p.endsWith("clear");
    await siteDO(env).fetch("https://state/" + (clear ? "fb-clear" : "fb-del"), { method: "POST", body: JSON.stringify({ id: String(body.id || "") }) });
    return jres({ ok: true });
  }
  if (p === "/api/admin/notice") {
    if (!(await isAdmin(request, env))) return jres({ error: "Not logged in" }, 401);
    const text = String(body.text || "").slice(0, 1000);
    const cur = await (await siteDO(env).fetch("https://state/notice-get")).json();
    if (body.reshow === false) await siteDO(env).fetch("https://state/notice-raw", { method: "POST", body: JSON.stringify({ on: body.on === true, text, v: cur.v }) });
    else await siteDO(env).fetch("https://state/notice-set", { method: "POST", body: JSON.stringify({ on: body.on === true, text }) });
    return jres({ ok: true, ...(await (await siteDO(env).fetch("https://state/notice-get")).json()) });
  }
  if (p === "/api/admin/login") {
    if (!env.ADMIN_PASSWORD) return jres({ error: "ADMIN_PASSWORD is not set on the worker." }, 503);
    const ip = request.headers.get("CF-Connecting-IP") || "x";
    const st = siteDO(env), q = (op) => st.fetch(`https://state/throttle?ip=${encodeURIComponent(ip)}&op=${op}`).then((r) => r.json());
    const t = await q("check");
    if (t.locked) return jres({ error: `Too many tries. Wait ${Math.ceil(t.retry / 60)} min.` }, 429, { "Retry-After": String(t.retry) });
    if (!(await passwordOk(env, body.password || ""))) {
      const f = await q("fail");
      return jres({ error: f.locked ? "Too many tries. Locked for 5 minutes." : "Wrong password." }, 401);
    }
    await q("clear");
    const exp = Math.floor(Date.now() / 1000) + TTL;
    const cookie = `yk_admin=${exp}.${await hmac(env.ADMIN_PASSWORD, "admin." + exp)}; Path=/; Max-Age=${TTL}; HttpOnly; SameSite=Strict${url.protocol === "https:" ? "; Secure" : ""}`;
    return jres({ ok: true }, 200, { "Set-Cookie": cookie });
  }
  if (p === "/api/admin/logout") {
    return jres({ ok: true }, 200, { "Set-Cookie": `yk_admin=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${url.protocol === "https:" ? "; Secure" : ""}` });
  }
  if (p === "/api/admin/downtime") {
    if (!(await isAdmin(request, env))) return jres({ error: "Not logged in" }, 401);
    const v = { down: body.down === true, message: String(body.message || "").slice(0, 200) };
    await siteDO(env).fetch("https://state/set", { method: "POST", body: JSON.stringify(v) });
    cache = { t: Date.now(), v };
    return jres({ ok: true, ...v });
  }
  return jres({ error: "Not found" }, 404);
}

// These stay reachable during downtime so you can still log in.
const OPEN_DURING_DOWNTIME = new Set(["/admin", "/admin/", "/admin.html", "/admin.js", "/style.css"]);

function downPage(message) {
  const msg = message ? `<p class="m">${esc(message)}</p>` : "";
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Yakton Games - Down for maintenance</title>
<style>:root{color-scheme:dark}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#17171a;color:#f4f4f0;font:16px/1.5 "Trebuchet MS",Verdana,sans-serif;padding:24px;text-align:center}
h1{margin:0 0 8px;font:400 clamp(2.4rem,9vw,4rem)/1 Impact,"Arial Black",sans-serif;color:#ffd21f;transform:skew(-6deg)}
.l{width:min(320px,80vw);margin:16px auto;border-top:4px dashed #ffd21f}p{margin:8px 0;color:#c8c8d0}.m{color:#f4f4f0;font-weight:700}
a{display:inline-block;margin-top:28px;padding:6px 16px;border:2px solid #9a9aa3;border-radius:4px;color:#9a9aa3;text-decoration:none;font-size:.85rem}a:hover{border-color:#ffd21f;color:#ffd21f}</style></head>
<body><main><h1>Yakton Games</h1><div class="l"></div><p>We're down for maintenance and will be back soon.</p>${msg}<a href="/admin">Admin</a></main>
<script>setInterval(()=>fetch('/api/status',{cache:'no-store'}).then(r=>r.json()).then(s=>{if(!s.down)location.reload()}).catch(()=>{}),30000)</script></body></html>`,
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "300", "X-Content-Type-Options": "nosniff" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return api(request, env, url);
    const status = await getStatus(env);
    if (status.down && !OPEN_DURING_DOWNTIME.has(url.pathname) && !(await isAdmin(request, env))) {
      if (url.pathname.startsWith("/ws/") || url.pathname.startsWith("/arena/")) return new Response("Down for maintenance", { status: 503 });
      return downPage(status.message);
    }
    if (url.pathname.startsWith("/ws/")) {
      const code = url.pathname.slice(4).toUpperCase().slice(0, 12);
      return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request);
    }
    if (url.pathname.startsWith("/arena/")) {
      const code = url.pathname.slice(7).toUpperCase().replace(/\W/g, "").slice(0, 8);
      if (!code) return new Response("Missing room code", { status: 400 });
      return env.ARENAS.get(env.ARENAS.idFromName(code)).fetch(request);
    }
    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    // Always fetch fresh pages and scripts so an old cached page never mixes with new scripts (that caused blank screens).
    const ct = headers.get("Content-Type") || "";
    if (/text\/html|javascript|css/.test(ct) || url.pathname === "/" || url.pathname.startsWith("/admin")) headers.set("Cache-Control", "no-cache");
    if (url.pathname.startsWith("/admin") || /text\/html/.test(ct)) headers.set("Cache-Control", "no-store");
    return new Response(res.body, { status: res.status, headers });
  },
};
