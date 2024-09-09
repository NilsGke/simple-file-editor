import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "./components/ui/toaster.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IDBClientProvider } from "./db/lib/IDBClientProvider.tsx";
import { IDBClient } from "./db/lib/IDBClient.ts";
import { migrations } from "./db/db.ts";

const queryClient = new QueryClient();

const dbClient = new IDBClient({ name: "localFiles", migrations });

createRoot(document.getElementById("root")!).render(
  <>
    <StrictMode>
      <IDBClientProvider client={dbClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </IDBClientProvider>
      <Toaster />
    </StrictMode>
  </>
);
