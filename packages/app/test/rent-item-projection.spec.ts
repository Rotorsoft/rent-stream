import { describe, it, expect, beforeEach } from "vitest";
import { ItemStatus, ItemCondition, ItemCategory, PricingStrategy, RentalItem } from "@rent-stream/domain";
import * as projection from "../src/api/rent-item-projection.js";
import { app } from "../src/api/index.js";
import { randomUUID } from "crypto";

describe("RentItem Projection", () => {
  const actor = { id: "user-1", name: "Alice" };

  // Helper to create items with required fields
  const createTestItem = async (
    stream: string,
    overrides: Partial<{
      name: string;
      serialNumber: string;
      category: typeof ItemCategory[keyof typeof ItemCategory];
      condition: typeof ItemCondition[keyof typeof ItemCondition];
      initialQuantity: number;
      basePrice: number;
      pricingStrategy: typeof PricingStrategy[keyof typeof PricingStrategy];
    }> = {}
  ) => {
    await app.do("CreateItem", { stream, actor }, {
      name: overrides.name || "Test Item",
      serialNumber: overrides.serialNumber || `SN-${Date.now()}`,
      category: overrides.category || ItemCategory.Other,
      condition: overrides.condition || ItemCondition.New,
      initialQuantity: overrides.initialQuantity ?? 5,
      basePrice: overrides.basePrice ?? 50,
      pricingStrategy: overrides.pricingStrategy || PricingStrategy.Linear,
    });
  };

  // Helper to get rental ID from state
  const getRentalId = async (stream: string): Promise<string> => {
    const snapshot = await app.load(RentalItem, stream);
    return snapshot.state.activeRentals[0]?.rentalId;
  };

  beforeEach(async () => {
    projection.itemReadModel.clear();
    await app.drain();
  });

  it("should update projection when an item is created", async () => {
    const stream = `item-${randomUUID()}`;
    await createTestItem(stream, {
      name: "Test Item",
      serialNumber: "SN-PROJ-1",
    });

    await app.correlate();
    await app.drain();

    const item = projection.itemReadModel.get(stream);
    expect(item).toBeDefined();
    expect(item!.name).toBe("Test Item");
    expect(item!.status).toBe(ItemStatus.Available);
    expect(item!.totalQuantity).toBe(5);
    expect(item!.availableQuantity).toBe(5);
  });

  it("should reflect quantity changes when rented", async () => {
    const stream = `item-${randomUUID()}`;
    await createTestItem(stream, {
      name: "Status Item",
      serialNumber: "SN-STATUS",
      initialQuantity: 5,
    });

    await app.do("RentItem", { stream, actor }, {
      renterId: "renter-1",
      quantity: 2,
      expectedReturnDate: new Date().toISOString(),
    });

    await app.correlate();
    await app.drain();

    const item = projection.itemReadModel.get(stream);
    expect(item).toBeDefined();
    expect(item!.status).toBe(ItemStatus.Available); // Still available (3 remaining)
    expect(item!.availableQuantity).toBe(3);
    expect(item!.totalQuantity).toBe(5);
  });

  it("should maintain quarantined status upon return if damaged", async () => {
    const stream = `item-${randomUUID()}`;
    await createTestItem(stream, {
      name: "Damage Item",
      serialNumber: "SN-DAMAGE",
      initialQuantity: 5,
    });

    await app.do("RentItem", { stream, actor }, {
      renterId: "renter-2",
      quantity: 1,
      expectedReturnDate: new Date().toISOString(),
    });

    const rentalId = await getRentalId(stream);

    await app.do("ReportDamage", { stream, actor }, {
      description: "Broken screen",
    });

    await app.do("ReturnItem", { stream, actor }, { rentalId });

    await app.correlate();
    await app.drain();

    const item = projection.itemReadModel.get(stream);
    expect(item).toBeDefined();
    expect(item!.status).toBe(ItemStatus.Quarantined);
  });

  it("should set status to Available upon return if NOT damaged", async () => {
    const stream = `item-${randomUUID()}`;
    await createTestItem(stream, {
      name: "Good Item",
      serialNumber: "SN-GOOD",
      initialQuantity: 5,
    });

    await app.do("RentItem", { stream, actor }, {
      renterId: "renter-3",
      quantity: 1,
      expectedReturnDate: new Date().toISOString(),
    });

    const rentalId = await getRentalId(stream);

    await app.do("ReturnItem", { stream, actor }, { rentalId });

    await app.correlate();
    await app.drain();

    const item = projection.itemReadModel.get(stream);
    expect(item).toBeDefined();
    expect(item!.status).toBe(ItemStatus.Available);
    expect(item!.availableQuantity).toBe(5); // Back to full
  });

  it("should update condition when an item is inspected", async () => {
    const stream = `item-${randomUUID()}`;
    await createTestItem(stream, {
      name: "Inspect Item",
      serialNumber: "SN-INSPECT",
    });

    await app.do("InspectItem", { stream, actor }, {
      condition: ItemCondition.Good,
      notes: "Looking good",
    });

    await app.correlate();
    await app.drain();

    const item = projection.itemReadModel.get(stream);
    expect(item!.condition).toBe(ItemCondition.Good);
  });

  it("should update status when maintenance is scheduled and completed", async () => {
    const stream = `item-${randomUUID()}`;
    await createTestItem(stream, {
      name: "Maintenance Item",
      serialNumber: "SN-MAINT",
    });

    await app.do("ScheduleMaintenance", { stream, actor }, {
      reason: "Annual checkup",
      scheduledDate: new Date().toISOString(),
    });

    await app.correlate();
    await app.drain();

    let item = projection.itemReadModel.get(stream);
    expect(item!.status).toBe(ItemStatus.Maintenance);
    expect(item!.maintenanceReason).toBe("Annual checkup");

    await app.do("CompleteMaintenance", { stream, actor }, {});

    await app.correlate();
    await app.drain();

    item = projection.itemReadModel.get(stream);
    expect(item!.status).toBe(ItemStatus.Available);
    expect(item!.maintenanceReason).toBeUndefined();
  });

  it("should update status when an item is retired", async () => {
    const stream = `item-${randomUUID()}`;
    await createTestItem(stream, {
      name: "Retired Item",
      serialNumber: "SN-RETIRE",
    });

    await app.do("RetireItem", { stream, actor }, {
      reason: "Too old",
    });

    await app.correlate();
    await app.drain();

    const item = projection.itemReadModel.get(stream);
    expect(item!.status).toBe(ItemStatus.Retired);
  });
});
