import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/seed",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // simple seed via HTTP for initial setup
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }),
});

export default http;
