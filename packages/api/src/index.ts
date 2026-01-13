import cors from "@fastify/cors";
import { RentalItem, actions } from "@rent-stream/domain";
import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import fastify from "fastify";
import { z } from "zod";
import { app, ee } from "./builder.js";
import * as projection from "./rent-item-projection.js";

// Initialize tRPC
const t = initTRPC.create();

export const router = t.router({
  // --- Commands ---
  createItem: t.procedure
    .input(actions.CreateItem)
    .mutation(async ({ input }) => {
      const actor = { id: "admin-1", name: "Admin" };
      const stream = `item-${Date.now()}`;
      await app.do("CreateItem", { stream, actor }, input);

      // Manually update projection immediately (don't wait for drain)
      projection.itemReadModel.set(stream, {
        stream,
        id: input.name.toLowerCase().replace(/\s+/g, '-'),
        name: input.name,
        serialNumber: input.serialNumber,
        status: "Available",
        condition: input.condition,
      });

      return { success: true, id: stream };
    }),

  rentItem: t.procedure
    .input(actions.RentItem.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "user-1", name: "Alice" };
      await app.do("RentItem", { stream: itemId, actor }, payload);

      return { success: true };
    }),

  returnItem: t.procedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const actor = { id: "user-1", name: "Alice" };
      await app.do("ReturnItem", { stream: input.itemId, actor }, {});

      return { success: true };
    }),

  reportDamage: t.procedure
    .input(actions.ReportDamage.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "staff-1", name: "Bob" };
      await app.do("ReportDamage", { stream: itemId, actor }, payload);

      return { success: true };
    }),

  inspectItem: t.procedure
    .input(actions.InspectItem.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "staff-1", name: "Bob" };
      await app.do("InspectItem", { stream: itemId, actor }, payload);

      return { success: true };
    }),

  scheduleMaintenance: t.procedure
    .input(actions.ScheduleMaintenance.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "staff-1", name: "Bob" };
      await app.do("ScheduleMaintenance", { stream: itemId, actor }, payload);

      return { success: true };
    }),

  completeMaintenance: t.procedure
    .input(actions.CompleteMaintenance.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "staff-1", name: "Bob" };
      await app.do("CompleteMaintenance", { stream: itemId, actor }, payload);

      return { success: true };
    }),

  retireItem: t.procedure
    .input(actions.RetireItem.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "admin-1", name: "Admin" };
      await app.do("RetireItem", { stream: itemId, actor }, payload);

      return { success: true };
    }),

  // --- Queries ---
  // Get single item state
  getItem: t.procedure
    .input(z.string())
    .query(async ({ input }) => {
      const snapshot = await app.load(RentalItem, input);
      return { state: snapshot.state };
    }),

  // List all items (Read Model)
  listItems: t.procedure
    .query(async () => {
      return Array.from(projection.itemReadModel.values());
    }),

  // Get event history for timeline
  getHistory: t.procedure
    .input(z.string())
    .query(async ({ input }) => {
      // Using query_array to fetch events for this stream
      const events = await app.query_array({ stream: input });
      return events.map((e: any) => ({
        id: e.id,
        name: e.name,
        created: e.created || new Date().toISOString(),
        data: e.data || {}
      }));
    }),

  // --- Subscriptions ---
  onInventoryUpdate: t.procedure.subscription(() => {
    return observable<{ timestamp: number }>((emit) => {
      const onUpdate = () => {
        emit.next({ timestamp: Date.now() });
      };
      ee.on("inventoryUpdated", onUpdate);
      return () => {
        ee.off("inventoryUpdated", onUpdate);
      };
    });
  }),
});

export type AppRouter = typeof router;

export const server = fastify({
  logger: process.env.NODE_ENV !== "test",
});

await server.register(cors, {
  origin: "*",
});

server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: { router: router },
});

// SSE endpoint for subscriptions (tRPC httpSubscriptionLink format)
server.get("/trpc/onInventoryUpdate.subscribe", async (request, reply) => {
  request.raw.setTimeout(0);

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
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

export const start = async () => {
  try {
    // Initial drain to catch up projections
    await app.drain();
    await server.listen({ port: 3000 });
    console.log("Server listening on http://localhost:3000");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  start();
}
