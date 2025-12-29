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
      const result = await app.do("CreateItem", { stream, actor }, input);
      return result;
    }),

  rentItem: t.procedure
    .input(actions.RentItem.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "user-1", name: "Alice" };
      const result = await app.do("RentItem", { stream: itemId, actor }, payload);
      return result;
    }),

  returnItem: t.procedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const actor = { id: "user-1", name: "Alice" }; // The renter returning it
      const result = await app.do("ReturnItem", { stream: input.itemId, actor }, {});
      return result;
    }),

  reportDamage: t.procedure
    .input(actions.ReportDamage.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "staff-1", name: "Bob" }; // Staff reporting damage
      const result = await app.do("ReportDamage", { stream: itemId, actor }, payload);
      return result;
    }),

  inspectItem: t.procedure
    .input(actions.InspectItem.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "staff-1", name: "Bob" };
      const result = await app.do("InspectItem", { stream: itemId, actor }, payload);
      return result;
    }),

  scheduleMaintenance: t.procedure
    .input(actions.ScheduleMaintenance.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "staff-1", name: "Bob" };
      const result = await app.do("ScheduleMaintenance", { stream: itemId, actor }, payload);
      return result;
    }),

  completeMaintenance: t.procedure
    .input(actions.CompleteMaintenance.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "staff-1", name: "Bob" };
      const result = await app.do("CompleteMaintenance", { stream: itemId, actor }, payload);
      return result;
    }),

  retireItem: t.procedure
    .input(actions.RetireItem.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "admin-1", name: "Admin" };
      const result = await app.do("RetireItem", { stream: itemId, actor }, payload);
      return result;
    }),

  // --- Queries ---
  // Get single item state
  getItem: t.procedure
    .input(z.string())
    .query(async ({ input }) => {
      return await app.load(RentalItem, input);
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
      return events;
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
