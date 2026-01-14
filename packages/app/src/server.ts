import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import fastify from "fastify";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { router, app, ee } from "./api/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const server = fastify({
  logger: process.env.NODE_ENV !== "test",
});

await server.register(cors, {
  origin: "*",
});

// SSE endpoint for subscriptions (must be before tRPC and static handlers)
server.get("/trpc/onInventoryUpdate.subscribe", async (request, reply) => {
  request.raw.setTimeout(0);

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "X-Accel-Buffering": "no",
  });
  reply.raw.flushHeaders();

  let eventId = 0;
  const sendMessage = (result: unknown) => {
    const id = (eventId++).toString();
    reply.raw.write(`id: ${id}\ndata: ${JSON.stringify({ id, result })}\n\n`);
  };

  sendMessage({ type: "started" });

  const onUpdate = () => {
    sendMessage({ type: "data", data: { timestamp: Date.now() } });
  };

  ee.on("inventoryUpdated", onUpdate);

  request.raw.on("close", () => {
    ee.off("inventoryUpdated", onUpdate);
  });
});

server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: { router },
});

// Serve static web files from the dist folder
const webDistPath = path.join(__dirname, "../dist");
server.register(fastifyStatic, {
  root: webDistPath,
  prefix: "/",
  wildcard: false,
});

// SPA fallback: serve index.html for all non-API routes
server.setNotFoundHandler(async (request, reply) => {
  // Don't serve index.html for API routes
  if (request.url.startsWith("/trpc")) {
    return reply.status(404).send({ error: "Not Found" });
  }
  return reply.sendFile("index.html");
});

export const start = async () => {
  try {
    // Initial drain to catch up projections
    await app.drain();
    const port = Number(process.env.PORT) || 3000;
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`Server listening on http://0.0.0.0:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  start();
}
