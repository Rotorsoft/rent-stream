import { RentalItem, actions, ItemStatus, ItemCategory, PricingStrategy, SkuStatus, generateSku } from "@rent-stream/domain";
import { initTRPC } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { app, ee } from "./builder.js";
import * as projection from "./rent-item-projection.js";

// Initialize tRPC
const t = initTRPC.create();

export const router = t.router({
  // --- Admin Commands ---
  createItem: t.procedure
    .input(actions.CreateItem)
    .mutation(async ({ input }) => {
      const actor = { id: "admin-1", name: "Admin" };
      const stream = `item-${Date.now()}`;
      await app.do("CreateItem", { stream, actor }, input);

      // Generate SKUs for immediate projection update
      const skus = [];
      for (let i = 1; i <= input.initialQuantity; i++) {
        skus.push({
          sku: generateSku(input.serialNumber, i),
          status: SkuStatus.Available,
          condition: input.condition,
        });
      }

      // Manually update projection immediately (don't wait for drain)
      projection.itemReadModel.set(stream, {
        stream,
        id: input.name.toLowerCase().replace(/\s+/g, "-"),
        name: input.name,
        description: input.description,
        serialNumber: input.serialNumber,
        category: input.category,
        status: ItemStatus.Available,
        condition: input.condition,
        skus,
        totalQuantity: input.initialQuantity,
        availableQuantity: input.initialQuantity,
        basePrice: input.basePrice,
        currentPrice: input.basePrice,
        pricingStrategy: input.pricingStrategy ?? PricingStrategy.Linear,
        activeRentals: [],
        imageUrl: input.imageUrl,
      });

      return { success: true, id: stream };
    }),

  addSkus: t.procedure
    .input(actions.AddSkus.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "admin-1", name: "Admin" };
      await app.do("AddSkus", { stream: itemId, actor }, payload);
      return { success: true };
    }),

  removeSkus: t.procedure
    .input(actions.RemoveSkus.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "admin-1", name: "Admin" };
      await app.do("RemoveSkus", { stream: itemId, actor }, payload);
      return { success: true };
    }),

  setBasePrice: t.procedure
    .input(actions.SetBasePrice.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "admin-1", name: "Admin" };
      await app.do("SetBasePrice", { stream: itemId, actor }, payload);
      return { success: true };
    }),

  setPricingStrategy: t.procedure
    .input(actions.SetPricingStrategy.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "admin-1", name: "Admin" };
      await app.do("SetPricingStrategy", { stream: itemId, actor }, payload);
      return { success: true };
    }),

  // --- Customer Commands ---
  rentItem: t.procedure
    .input(actions.RentItem.extend({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      const { itemId, ...payload } = input;
      const actor = { id: "user-1", name: "Alice" };
      await app.do("RentItem", { stream: itemId, actor }, payload);

      return { success: true };
    }),

  returnItem: t.procedure
    .input(z.object({ itemId: z.string(), rentalId: z.string() }))
    .mutation(async ({ input }) => {
      const actor = { id: "user-1", name: "Alice" };
      await app.do("ReturnItem", { stream: input.itemId, actor }, { rentalId: input.rentalId });

      return { success: true };
    }),

  // --- Staff Commands ---
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
  getItem: t.procedure.input(z.string()).query(async ({ input }) => {
    const snapshot = await app.load(RentalItem, input);
    return { state: snapshot.state };
  }),

  // List all items (Read Model) with optional filtering
  listItems: t.procedure
    .input(z.object({
      inStock: z.boolean().optional(),
      category: z.nativeEnum(ItemCategory).optional(),
    }).optional())
    .query(async ({ input }) => {
      let items = Array.from(projection.itemReadModel.values());

      if (input?.inStock !== undefined) {
        items = items.filter(item =>
          input.inStock ? item.availableQuantity > 0 : item.availableQuantity === 0
        );
      }

      if (input?.category) {
        items = items.filter(item => item.category === input.category);
      }

      return items;
    }),

  // Get availability summary
  getAvailability: t.procedure.query(async () => {
    const items = Array.from(projection.itemReadModel.values());

    const summary = {
      totalItems: items.length,
      totalQuantity: items.reduce((acc, item) => acc + item.totalQuantity, 0),
      availableQuantity: items.reduce((acc, item) => acc + item.availableQuantity, 0),
      byCategory: {} as Record<string, { total: number; available: number }>,
      byStatus: {} as Record<string, number>,
    };

    for (const item of items) {
      // By category
      if (!summary.byCategory[item.category]) {
        summary.byCategory[item.category] = { total: 0, available: 0 };
      }
      summary.byCategory[item.category].total += item.totalQuantity;
      summary.byCategory[item.category].available += item.availableQuantity;

      // By status
      if (!summary.byStatus[item.status]) {
        summary.byStatus[item.status] = 0;
      }
      summary.byStatus[item.status]++;
    }

    return summary;
  }),

  // Get event history for timeline
  getHistory: t.procedure.input(z.string()).query(async ({ input }) => {
    // Using query_array to fetch events for this stream
    const events = await app.query_array({ stream: input });
    return events.map((e) => ({
      id: e.id,
      name: e.name,
      created: e.created?.toISOString() || new Date().toISOString(),
      data: e.data || {},
    }));
  }),

  // Get recent events across all items for admin log
  getRecentEvents: t.procedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 50;
      // Query all events without stream filter, ordered by most recent
      const events = await app.query_array({ after: -1, limit });

      // Get item names from projection for context
      const itemNames = new Map<string, string>();
      for (const [stream, item] of projection.itemReadModel.entries()) {
        itemNames.set(stream, item.name);
      }

      return events
        .map((e) => ({
          id: e.id,
          stream: e.stream,
          itemName: itemNames.get(e.stream) || e.stream,
          name: e.name,
          created: e.created?.toISOString() || new Date().toISOString(),
          data: e.data || {},
        }))
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
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

// Re-export app and event emitter for server setup
export { app, ee };
