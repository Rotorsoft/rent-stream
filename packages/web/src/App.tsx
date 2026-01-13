import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink, splitLink, httpSubscriptionLink } from "@trpc/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { trpc } from "./utils/trpc";
import { Layout } from "./components/Layout";
import { Inventory } from "./pages/Inventory";
import { ItemDetail } from "./pages/ItemDetail";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        splitLink({
          condition: (op) => op.type === "subscription",
          true: httpSubscriptionLink({
            url: `${API_URL}/trpc`,
          }),
          false: httpLink({
            url: `${API_URL}/trpc`,
          }),
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Inventory />} />
              <Route path="items/:id" element={<ItemDetail />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;