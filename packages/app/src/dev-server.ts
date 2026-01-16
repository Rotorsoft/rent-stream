import cors from "@fastify/cors";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import fastify from "fastify";
import { createServer as createViteServer } from "vite";
import { router, app, ee } from "./api/index.js";
import { seedInventory, checkIfSeeded } from "./seed-data.js";

const server = fastify({
  logger: true,
});

await server.register(cors, {
  origin: "*",
});

// SSE endpoint for subscriptions (must be before tRPC)
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

// Create Vite dev server in middleware mode
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "spa",
});

// Use Vite's middleware for all non-API requests
server.addHook("onRequest", async (request, reply) => {
  if (request.url.startsWith("/trpc")) {
    return; // Let Fastify handle API routes
  }

  // Let Vite handle everything else (with HMR support)
  await new Promise<void>((resolve) => {
    vite.middlewares(request.raw, reply.raw, () => resolve());
  });
  reply.hijack();
});

const start = async () => {
  try {
    // Initial drain to catch up projections
    await app.drain();

    // Auto-seed if no items exist
    const isSeeded = await checkIfSeeded();
    if (!isSeeded) {
      console.log("No inventory found. Seeding database...");
      await seedInventory();
      await app.drain();
      console.log("Seed completed.");
    }

    const port = Number(process.env.PORT) || 3000;
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`\n  Dev server running at http://localhost:${port}\n`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
