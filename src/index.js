// Serves everything in /public, relays chess and two-player games (Room), relays Heli Royale lobbies of up to 8 pilots (Arena), adds security headers.
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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
    return new Response(res.body, { status: res.status, headers });
  },
};
