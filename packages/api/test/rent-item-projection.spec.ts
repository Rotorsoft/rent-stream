import { describe, it, expect, beforeEach } from "vitest";
import { ItemStatus, ItemCondition } from "@rent-stream/domain";
import * as projection from "../src/rent-item-projection.js";
import { app } from "../src/builder.js";
import { randomUUID } from "crypto";

describe("RentItem Projection", () => {
  const actor = { id: "user-1", name: "Alice" };

  beforeEach(async () => {
    projection.itemReadModel.clear();
    await app.drain();
  });

  it("should update projection when an item is created", async () => {
    const stream = `item-${randomUUID()}`;
    await app.do("CreateItem", { stream, actor }, {
      name: "Test Item",
      serialNumber: "SN-PROJ-1",
      condition: ItemCondition.New,
    });

    await app.correlate();
    await app.drain();

    const item = projection.itemReadModel.get(stream);
    expect(item).toBeDefined();
    expect(item.name).toBe("Test Item");
    expect(item.status).toBe(ItemStatus.Available);
  });

  it("should reflect status changes in the projection", async () => {
    const stream = `item-${randomUUID()}`;
    await app.do("CreateItem", { stream, actor }, {
      name: "Status Item",
      serialNumber: "SN-STATUS",
      condition: ItemCondition.New,
    });

    await app.do("RentItem", { stream, actor }, {
      renterId: "renter-1",
      expectedReturnDate: new Date().toISOString(),
    });

    await app.correlate();
    await app.drain();

    const item = projection.itemReadModel.get(stream);
    expect(item).toBeDefined();
    expect(item.status).toBe(ItemStatus.Rented);
    expect(item.currentRenterId).toBe("renter-1");
  });

  it("should maintain quarantined status upon return if damaged", async () => {
    const stream = `item-${randomUUID()}`;
    await app.do("CreateItem", { stream, actor }, {
      name: "Damage Item",
      serialNumber: "SN-DAMAGE",
      condition: ItemCondition.New,
    });

    await app.do("RentItem", { stream, actor }, {
      renterId: "renter-2",
      expectedReturnDate: new Date().toISOString(),
    });

    await app.do("ReportDamage", { stream, actor }, {
      description: "Broken screen",
    });

    await app.do("ReturnItem", { stream, actor }, {});

    await app.correlate();
    await app.drain();

    const item = projection.itemReadModel.get(stream);
    expect(item).toBeDefined();
    expect(item.status).toBe(ItemStatus.Quarantined);
    expect(item.currentRenterId).toBeUndefined();
  });

  it("should set status to Available upon return if NOT damaged", async () => {
    const stream = `item-${randomUUID()}`;
    await app.do("CreateItem", { stream, actor }, {
      name: "Good Item",
      serialNumber: "SN-GOOD",
      condition: ItemCondition.New,
    });

    await app.do("RentItem", { stream, actor }, {
      renterId: "renter-3",
      expectedReturnDate: new Date().toISOString(),
    });

    await app.do("ReturnItem", { stream, actor }, {});

    await app.correlate();
    await app.drain();

    const item = projection.itemReadModel.get(stream);
    expect(item).toBeDefined();
    expect(item.status).toBe(ItemStatus.Available);
  });

  it("should update condition when an item is inspected", async () => {
    const stream = `item-${randomUUID()}`;
    await app.do("CreateItem", { stream, actor }, {
      name: "Inspect Item",
      serialNumber: "SN-INSPECT",
      condition: ItemCondition.New,
    });

    await app.do("InspectItem", { stream, actor }, {
      condition: ItemCondition.Good,
      notes: "Looking good",
    });

    await app.correlate();
    await app.drain();

    const item = projection.itemReadModel.get(stream);
    expect(item.condition).toBe(ItemCondition.Good);
  });

  it("should update status when maintenance is scheduled and completed", async () => {
    const stream = `item-${randomUUID()}`;
    await app.do("CreateItem", { stream, actor }, {
      name: "Maintenance Item",
      serialNumber: "SN-MAINT",
      condition: ItemCondition.New,
    });

    await app.do("ScheduleMaintenance", { stream, actor }, {
      reason: "Annual checkup",
      scheduledDate: new Date().toISOString(),
    });

    await app.correlate();
    await app.drain();

    let item = projection.itemReadModel.get(stream);
    expect(item.status).toBe(ItemStatus.Maintenance);
    expect(item.maintenanceReason).toBe("Annual checkup");

    await app.do("CompleteMaintenance", { stream, actor }, {});

    await app.correlate();
    await app.drain();

    item = projection.itemReadModel.get(stream);
    expect(item.status).toBe(ItemStatus.Available);
    expect(item.maintenanceReason).toBeUndefined();
  });

  it("should update status when an item is retired", async () => {
    const stream = `item-${randomUUID()}`;
    await app.do("CreateItem", { stream, actor }, {
      name: "Retired Item",
      serialNumber: "SN-RETIRE",
      condition: ItemCondition.New,
    });

    await app.do("RetireItem", { stream, actor }, {
      reason: "Too old",
    });

    await app.correlate();
    await app.drain();

    const item = projection.itemReadModel.get(stream);
    expect(item.status).toBe(ItemStatus.Retired);
  });
});
