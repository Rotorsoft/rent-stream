import { RentalItem } from "@rent-stream/domain";
import { act } from "@rotorsoft/act";
import { EventEmitter } from "node:events";
import * as projection from "./rent-item-projection.js";

export const builder = act().with(RentalItem);
export const ee = new EventEmitter();

export const app = builder
  .on("ItemCreated").do(projection.itemCreated).to("items")
  .on("ItemRented").do(projection.itemRented).to("items")
  .on("ItemReturned").do(projection.itemReturned).to("items")
  .on("QuantityAdded").do(projection.quantityAdded).to("items")
  .on("QuantityRemoved").do(projection.quantityRemoved).to("items")
  .on("BasePriceSet").do(projection.basePriceSet).to("items")
  .on("PricingStrategyChanged").do(projection.pricingStrategyChanged).to("items")
  .on("PriceRecalculated").do(projection.priceRecalculated).to("items")
  .on("ItemInspected").do(projection.itemInspected).to("items")
  .on("DamageReported").do(projection.damageReported).to("items")
  .on("MaintenanceScheduled").do(projection.maintenanceScheduled).to("items")
  .on("MaintenanceCompleted").do(projection.maintenanceCompleted).to("items")
  .on("ItemRetired").do(projection.itemRetired).to("items")
  .build();

// Trigger drain on commit to update projections
app.on("committed", () => {
  if (process.env.NODE_ENV !== "test") {
    app.drain()
      .then(() => ee.emit("inventoryUpdated"))
      .catch(() => ee.emit("inventoryUpdated"));
  }
});

if (process.env.NODE_ENV !== "test") {
  app.start_correlations({ after: 0, limit: 10 }, 3000);
}
