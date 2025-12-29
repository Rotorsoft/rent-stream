import { describe, it, expect } from "vitest";
import { act } from "@rotorsoft/act";
import { RentalItem, ItemStatus, ItemCondition } from "../src/index.js";

describe("RentalItem", () => {
  const app = act().with(RentalItem).build();
  const actor = { id: "user-1", name: "Alice" };

  it("should create a new rental item", async () => {
    const stream = "item-123";
    await app.do(
      "CreateItem",
      { stream, actor },
      {
        name: "RED V-Raptor",
        serialNumber: "VR-999",
        condition: ItemCondition.New,
      }
    );

    const snapshot = await app.load(RentalItem, stream);
    expect(snapshot.state.name).toBe("RED V-Raptor");
    expect(snapshot.state.status).toBe(ItemStatus.Available);
    expect(snapshot.state.condition).toBe(ItemCondition.New);
  });

  it("should rent an available item", async () => {
    const stream = "item-123";
    await app.do(
      "RentItem",
      { stream, actor },
      {
        renterId: "renter-456",
        expectedReturnDate: "2025-12-30T00:00:00Z",
      }
    );

    const snapshot = await app.load(RentalItem, stream);
    expect(snapshot.state.status).toBe(ItemStatus.Rented);
    expect(snapshot.state.currentRenterId).toBe("renter-456");
  });

  it("should fail to rent an item that is already rented", async () => {
    const stream = "item-123";
    await expect(
      app.do(
        "RentItem",
        { stream, actor },
        {
          renterId: "renter-789",
          expectedReturnDate: "2025-12-31T00:00:00Z",
        }
      )
    ).rejects.toThrow("Item must be Available");
  });

  it("should return a rented item", async () => {
    const stream = "item-123";
    await app.do("ReturnItem", { stream, actor }, {});

    const snapshot = await app.load(RentalItem, stream);
    expect(snapshot.state.status).toBe(ItemStatus.Available);
    expect(snapshot.state.currentRenterId).toBeUndefined();
  });

  it("should quarantine an item when damage is reported", async () => {
    const stream = "item-123";
    await app.do(
      "ReportDamage",
      { stream, actor },
      { description: "Scratched sensor" }
    );

    const snapshot = await app.load(RentalItem, stream);
    expect(snapshot.state.status).toBe(ItemStatus.Quarantined);
    expect(snapshot.state.condition).toBe(ItemCondition.Damaged);
    expect(snapshot.state.damageReport).toBe("Scratched sensor");
  });

  it("should report damage without an actor", async () => {
    const stream = "item-damage-no-actor";
    await app.do("CreateItem", { stream, actor }, {
      name: "Tripod",
      serialNumber: "TP-2",
      condition: ItemCondition.New,
    });

    await app.do(
      "ReportDamage",
      { stream }, // No actor
      { description: "Missing leg" }
    );

    const snapshot = await app.load(RentalItem, stream);
    expect(snapshot.state.damageReport).toBe("Missing leg");
  });

  it("should not allow renting a quarantined item", async () => {
    const stream = "item-123";
    await expect(
      app.do(
        "RentItem",
        { stream, actor },
        {
          renterId: "renter-789",
          expectedReturnDate: "2025-12-31T00:00:00Z",
        }
      )
    ).rejects.toThrow("Item must be Available");
  });

  it("should transition to maintenance and back to available", async () => {
    const stream = "item-maint-1";
    await app.do("CreateItem", { stream, actor }, {
      name: "Drill",
      serialNumber: "SN123",
      condition: ItemCondition.New,
    });

    await app.do("ScheduleMaintenance", { stream, actor }, {
      reason: "Routine Check",
      scheduledDate: new Date().toISOString(),
    });
    
    let snapshot = await app.load(RentalItem, stream);
    expect(snapshot.state.status).toBe(ItemStatus.Maintenance);

    await app.do("CompleteMaintenance", { stream, actor }, {});
    snapshot = await app.load(RentalItem, stream);
    expect(snapshot.state.status).toBe(ItemStatus.Available);
  });

  it("should allow returning an item that was reported damaged while rented", async () => {
    const stream = "item-damaged-rented";
    await app.do("CreateItem", { stream, actor }, {
      name: "Camera",
      serialNumber: "CAM-001",
      condition: ItemCondition.New,
    });

    await app.do("RentItem", { stream, actor }, {
      renterId: "User1",
      expectedReturnDate: new Date().toISOString(),
    });

    await app.do("ReportDamage", { stream, actor }, {
      description: "Lens cracked",
    });

    // This should NOT fail, but currently does because status is Quarantined, not Rented
    await app.do("ReturnItem", { stream, actor }, {});
    
    // After return, it should remain Quarantined (or Maintenance), not become Available
    const snapshot = await app.load(RentalItem, stream);
    expect(snapshot.state.currentRenterId).toBeUndefined();
    expect(snapshot.state.status).toBe(ItemStatus.Quarantined); 
  });

  it("should inspect an item and update its condition", async () => {
    const stream = "item-inspect";
    await app.do("CreateItem", { stream, actor }, {
      name: "Tripod",
      serialNumber: "TP-1",
      condition: ItemCondition.New,
    });

    await app.do("InspectItem", { stream, actor }, {
      condition: ItemCondition.Good,
      notes: "Slightly used",
    });

    const snapshot = await app.load(RentalItem, stream);
    expect(snapshot.state.condition).toBe(ItemCondition.Good);
  });

  it("should retire an item", async () => {
    const stream = "item-retire";
    await app.do("CreateItem", { stream, actor }, {
      name: "Old Camera",
      serialNumber: "SN-OLD",
      condition: ItemCondition.Poor,
    });

    await app.do("RetireItem", { stream, actor }, {
      reason: "Too many repairs",
    });

    const snapshot = await app.load(RentalItem, stream);
    expect(snapshot.state.status).toBe(ItemStatus.Retired);
  });

  it("should not allow retiring an already retired item", async () => {
    const stream = "item-retire-twice";
    await app.do("CreateItem", { stream, actor }, {
      name: "Old Camera",
      serialNumber: "SN-OLD",
      condition: ItemCondition.Poor,
    });

    await app.do("RetireItem", { stream, actor }, { reason: "End of life" });
    
    await expect(
      app.do("RetireItem", { stream, actor }, { reason: "Again" })
    ).rejects.toThrow("Item must not be retired");
  });
});

