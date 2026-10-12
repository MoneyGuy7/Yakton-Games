// Serves everything in /public, relays chess and multiplayer games between two players, adds security headers.
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/ws/")) {
      const code = url.pathname.slice(4).toUpperCase().slice(0, 12);
      return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request);
    }
    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return new Response(res.body, { status: res.status, headers });
  },
};
