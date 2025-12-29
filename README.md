# RentStream

**Lifecycle & Compliance Platform for High-Value Equipment Rentals.**

RentStream is a SaaS application designed to track the chain of custody and condition of high-value rental assets (cameras, medical devices, heavy machinery). It leverages the **@rotorsoft/act** Event Sourcing framework to provide an immutable, auditable history of every item.

## Architecture

This project is built using the **Act** framework, utilizing the Event Sourcing pattern.

- **State**: The `RentalItem` state represents the current truth of an asset (Status, Condition, Current Renter).
- **Actions**: Explicit intents to change state (e.g., `RentItem`, `ReportDamage`).
- **Events**: Immutable records of what happened (e.g., `ItemRented`, `DamageReported`).

### Domain Model

The core aggregate is the `RentalItem`.

**Status Flow:**
`Available` -> `Rented` -> `Available` (via Return)
`Available` -> `Maintenance` -> `Available`
Any State -> `Quarantined` (via Damage Report) -> `Maintenance`
Any State -> `Retired`

**Key Features:**
- **Audit Trail**: Every inspection and handoff is recorded.
- **Invariants**: Cannot rent an item that is damaged or in maintenance.
- **Concurrency**: Optimistic locking prevents double-booking.

## Project Structure

- `packages/domain`: Contains the Act definitions (State, Events, Actions) and Zod schemas.
- `packages/api` (Planned): Backend API.
- `packages/web` (Planned): Frontend dashboard.

## Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Build the domain package:
   ```bash
   pnpm build
   ```

## License

MIT

