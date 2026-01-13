# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
pnpm dev                              # Run API (port 3000) and Web concurrently
pnpm -F @rent-stream/api dev          # API only with hot reload
pnpm -F @rent-stream/web dev          # Web only (Vite dev server)

# Build
pnpm build                            # Build all packages
pnpm -F @rent-stream/domain build     # Domain package (required before API)

# Testing
pnpm test                             # Run all tests via Vitest
pnpm -F @rent-stream/domain test      # Domain tests only
vitest run packages/domain            # Run specific package tests
vitest run -t "should rent"           # Run tests matching pattern

# Lint
pnpm lint                             # Lint all packages
```

## Architecture Overview

This is a **pnpm monorepo** implementing an equipment rental lifecycle platform using **Event Sourcing**.

### Package Structure

- **`packages/domain`** - Core domain logic using @rotorsoft/act event sourcing framework
- **`packages/api`** - Fastify server with tRPC routes exposing domain operations
- **`packages/web`** - React + Vite + Tailwind v4 dashboard

### Event Sourcing Pattern

The domain uses @rotorsoft/act framework with this pattern:

```typescript
// State is derived from events, never mutated directly
const RentalItem = act<State, Events, Actions>("RentalItem", {
  schemas: { state: RentalItemSchema, events: {...}, actions: {...} },
  init: () => defaultState,
  reducer: { /* event handlers that return new state */ },
  actions: { /* commands that validate invariants and emit events */ }
});
```

**Key concepts:**
- **Events**: Immutable facts (ItemCreated, ItemRented, ItemReturned, DamageReported, etc.)
- **Actions**: Commands that validate business rules then emit events
- **Invariants**: Guards like `Item.mustBe(ItemStatus.Available)` that throw if violated
- **Projections**: Read models in `rent-item-projection.ts` that materialize state from events

### tRPC API Structure

Routes in `packages/api/src/index.ts`:
- **Mutations**: createItem, rentItem, returnItem, inspectItem, reportDamage, scheduleMaintenance, completeMaintenance, retireItem
- **Queries**: getItem, listItems, getHistory
- **Subscriptions**: onInventoryUpdate (real-time via EventEmitter)

### Frontend Patterns

- **Tailwind v4**: Custom theme defined in `@theme` block in `index.css` (not tailwind.config.js)
- **Custom colors**: `brand-*` (purple) and `accent-*` (pink) palettes
- **Data fetching**: tRPC + React Query with refetch on mutation success
- **Animations**: Framer Motion for transitions

## Domain Model

**RentalItem Status Flow:**
```
Available → Rented → Available
    ↓          ↓
Maintenance ← ─┘
    ↓
Quarantined
    ↓
Retired (terminal)
```

**Condition tracking**: New → Good → Fair → Poor → Damaged

## Recommended Claude Code Plugins

Install the frontend-design plugin for better UI/UX when working on the web package:

```bash
/plugin install frontend-design@claude-code-plugins
```

This plugin provides guidance on typography, color themes, and motion for producing polished, production-grade frontend interfaces with Tailwind and React.

## Testing Approach

Tests use the act framework's testing pattern:
```typescript
const app = RentalItem();
await app.do(actions.CreateItem({ ... }));
const state = await app.load();
expect(state.status).toBe(ItemStatus.Available);
```

Test files:
- `packages/domain/test/rental-item.spec.ts` - State machine transitions and invariants
- `packages/api/test/api.spec.ts` - tRPC router operations
