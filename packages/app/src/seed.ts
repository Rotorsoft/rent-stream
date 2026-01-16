/**
 * Seed script for populating the inventory with realistic rental items.
 * Run with: pnpm seed
 */

import { ItemCategory, ItemCondition, PricingStrategy } from "@rent-stream/domain";
import { app } from "./api/builder.js";

interface SeedItem {
  name: string;
  category: ItemCategory;
  quantity: number;
  basePrice: number;
  pricingStrategy?: PricingStrategy;
  condition?: ItemCondition;
  imageUrl?: string;
  description?: string;
}

// Realistic rental items across categories
const seedItems: SeedItem[] = [
  // Outdoor/Recreation
  {
    name: "Mountain Bike - Trail Pro",
    category: ItemCategory.Outdoor,
    quantity: 8,
    basePrice: 45,
    pricingStrategy: PricingStrategy.Tiered,
    imageUrl: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800",
    description: "Full suspension mountain bike for trail riding",
  },
  {
    name: "Road Bike - Carbon Elite",
    category: ItemCategory.Outdoor,
    quantity: 5,
    basePrice: 65,
    pricingStrategy: PricingStrategy.Linear,
    imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800",
    description: "Lightweight carbon road bike",
  },
  {
    name: "Kayak - Single Person",
    category: ItemCategory.Outdoor,
    quantity: 6,
    basePrice: 55,
    pricingStrategy: PricingStrategy.Tiered,
    imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
    description: "Stable recreational kayak with paddle",
  },
  {
    name: "Camping Tent - 4 Person",
    category: ItemCategory.Outdoor,
    quantity: 12,
    basePrice: 35,
    pricingStrategy: PricingStrategy.Linear,
    imageUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
    description: "Waterproof dome tent with vestibule",
  },
  {
    name: "Hiking Backpack - 65L",
    category: ItemCategory.Outdoor,
    quantity: 15,
    basePrice: 20,
    pricingStrategy: PricingStrategy.Linear,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
    description: "Large capacity hiking backpack",
  },
  {
    name: "Stand Up Paddleboard",
    category: ItemCategory.Outdoor,
    quantity: 4,
    basePrice: 50,
    pricingStrategy: PricingStrategy.Exponential,
    imageUrl: "https://images.unsplash.com/photo-1526188717906-ab4a2f949f28?w=800",
    description: "Inflatable SUP with pump and paddle",
  },

  // Tools/Equipment
  {
    name: "Power Drill - Cordless",
    category: ItemCategory.Tools,
    quantity: 10,
    basePrice: 25,
    pricingStrategy: PricingStrategy.Linear,
    imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800",
    description: "20V cordless drill with battery",
  },
  {
    name: "Pressure Washer - 3000 PSI",
    category: ItemCategory.Tools,
    quantity: 4,
    basePrice: 75,
    pricingStrategy: PricingStrategy.Tiered,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    description: "Gas-powered pressure washer",
  },
  {
    name: "Generator - 5500W",
    category: ItemCategory.Tools,
    quantity: 3,
    basePrice: 95,
    pricingStrategy: PricingStrategy.Exponential,
    imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800",
    description: "Portable generator with electric start",
  },
  {
    name: "Circular Saw - 7.25 inch",
    category: ItemCategory.Tools,
    quantity: 6,
    basePrice: 30,
    pricingStrategy: PricingStrategy.Linear,
    imageUrl: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800",
    description: "Corded circular saw with blade",
  },
  {
    name: "Concrete Mixer - Electric",
    category: ItemCategory.Tools,
    quantity: 2,
    basePrice: 85,
    pricingStrategy: PricingStrategy.Tiered,
    description: "3.5 cubic ft electric mixer",
  },

  // Party/Events
  {
    name: "Folding Table - 6ft",
    category: ItemCategory.Party,
    quantity: 25,
    basePrice: 12,
    pricingStrategy: PricingStrategy.Linear,
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
    description: "Rectangular folding table",
  },
  {
    name: "Folding Chair - White",
    category: ItemCategory.Party,
    quantity: 50,
    basePrice: 5,
    pricingStrategy: PricingStrategy.Linear,
    description: "Standard folding chair",
  },
  {
    name: "Canopy Tent - 10x10",
    category: ItemCategory.Party,
    quantity: 8,
    basePrice: 45,
    pricingStrategy: PricingStrategy.Tiered,
    imageUrl: "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=800",
    description: "Pop-up canopy with sides",
  },
  {
    name: "Outdoor Heater - Propane",
    category: ItemCategory.Party,
    quantity: 6,
    basePrice: 55,
    pricingStrategy: PricingStrategy.Exponential,
    description: "Patio heater with tank",
  },
  {
    name: "Chafing Dish Set",
    category: ItemCategory.Party,
    quantity: 15,
    basePrice: 18,
    pricingStrategy: PricingStrategy.Linear,
    description: "Stainless steel buffet warmer",
  },

  // Electronics
  {
    name: "Projector - 4K HDR",
    category: ItemCategory.Electronics,
    quantity: 4,
    basePrice: 125,
    pricingStrategy: PricingStrategy.Exponential,
    imageUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800",
    description: "4K projector with HDMI",
  },
  {
    name: "PA System - 1000W",
    category: ItemCategory.Electronics,
    quantity: 3,
    basePrice: 150,
    pricingStrategy: PricingStrategy.Tiered,
    description: "Powered speakers with mixer",
  },
  {
    name: "DSLR Camera - Full Frame",
    category: ItemCategory.Electronics,
    quantity: 5,
    basePrice: 175,
    pricingStrategy: PricingStrategy.Exponential,
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800",
    description: "Professional DSLR with 24-70mm lens",
  },
  {
    name: "GoPro Hero 12",
    category: ItemCategory.Electronics,
    quantity: 8,
    basePrice: 45,
    pricingStrategy: PricingStrategy.Linear,
    imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800",
    description: "Action camera with accessories",
  },
  {
    name: "Wireless Microphone System",
    category: ItemCategory.Electronics,
    quantity: 6,
    basePrice: 65,
    pricingStrategy: PricingStrategy.Linear,
    description: "Dual handheld wireless mic set",
  },

  // Sports
  {
    name: "Ski Package - Adult",
    category: ItemCategory.Sports,
    quantity: 15,
    basePrice: 55,
    pricingStrategy: PricingStrategy.Tiered,
    imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800",
    description: "Skis, boots, and poles",
  },
  {
    name: "Snowboard Package",
    category: ItemCategory.Sports,
    quantity: 10,
    basePrice: 50,
    pricingStrategy: PricingStrategy.Tiered,
    imageUrl: "https://images.unsplash.com/photo-1478700486477-ff1f3f5f73d4?w=800",
    description: "Board, boots, and bindings",
  },
  {
    name: "Golf Club Set - Full",
    category: ItemCategory.Sports,
    quantity: 8,
    basePrice: 65,
    pricingStrategy: PricingStrategy.Linear,
    imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800",
    description: "14-piece set with bag",
  },
  {
    name: "Tennis Racket - Pro",
    category: ItemCategory.Sports,
    quantity: 12,
    basePrice: 20,
    pricingStrategy: PricingStrategy.Linear,
    imageUrl: "https://images.unsplash.com/photo-1617083934551-ac1f1b0c8c1e?w=800",
    description: "Competition-grade racket",
  },
  {
    name: "Surfboard - Longboard",
    category: ItemCategory.Sports,
    quantity: 6,
    basePrice: 40,
    pricingStrategy: PricingStrategy.Exponential,
    imageUrl: "https://images.unsplash.com/photo-1531722569936-825d3dd91b15?w=800",
    description: "9ft longboard with leash",
  },
  {
    name: "Wetsuit - Full Length",
    category: ItemCategory.Sports,
    quantity: 10,
    basePrice: 25,
    pricingStrategy: PricingStrategy.Linear,
    description: "3/2mm neoprene wetsuit",
  },
];

async function seed() {
  console.log("Seeding inventory with", seedItems.length, "items...\n");

  const actor = { id: "seed-admin", name: "Seed Script" };

  for (const item of seedItems) {
    const stream = `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    try {
      await app.do("CreateItem", { stream, actor }, {
        name: item.name,
        description: item.description,
        serialNumber: `SN-${Math.floor(Math.random() * 1000000)}`,
        category: item.category,
        condition: item.condition || ItemCondition.New,
        initialQuantity: item.quantity,
        basePrice: item.basePrice,
        pricingStrategy: item.pricingStrategy || PricingStrategy.Linear,
        imageUrl: item.imageUrl,
      });

      console.log(`  Created: ${item.name} (qty: ${item.quantity}, $${item.basePrice}/day)`);

      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (error) {
      console.error(`  Failed to create ${item.name}:`, error);
    }
  }

  // Drain events to update projections
  await app.drain();

  console.log("\nSeed completed successfully!");
  console.log(`Total items created: ${seedItems.length}`);
  console.log(`Total inventory units: ${seedItems.reduce((acc, item) => acc + item.quantity, 0)}`);

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
