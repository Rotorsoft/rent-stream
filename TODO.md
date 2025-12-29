# TODO

## Phase 1: Core Domain
- [x] Define Zod Schemas for RentalItem, Events, and Actions.
- [x] Implement `RentalItem` Act state machine with invariants.
- [x] Add unit tests for `RentalItem` transitions.

## Phase 2: Persistence & API
- [ ] Set up PostgreSQL with `@rotorsoft/act-pg`.
- [x] Create `packages/api` (Node.js/Fastify).
- [x] Implement tRPC routers for exposing actions.
- [ ] Add authentication (e.g., Auth0 or Clerk) to populate `actor` context.

## Phase 3: Frontend (Web)
- [x] Initialize `packages/web` (Vite + React + Tailwind).
- [x] Build "Create & View" UI to verify end-to-end flow.
- [x] Build "Asset Timeline" view (visualizing the event stream).
- [x] Build "Inventory" dashboard.
- [x] Implement "Check-out/Check-in" flows.

## Phase 4: Advanced Features
- [ ] Add "Subscription" capability for rental updates.
- [ ] Implement "Dual-Frontier Drain" for real-time dashboard updates.
- [ ] Add "Maintenance Rules" (auto-block after X rentals).

