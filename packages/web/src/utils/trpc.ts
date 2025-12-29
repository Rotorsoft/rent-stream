import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@rent-stream/api";

export const trpc = createTRPCReact<AppRouter>();

