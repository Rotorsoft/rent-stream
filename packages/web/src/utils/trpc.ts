import { createTRPCReact, type CreateTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@rent-stream/api";

export const trpc: CreateTRPCReact<AppRouter, any> = createTRPCReact<AppRouter>();

