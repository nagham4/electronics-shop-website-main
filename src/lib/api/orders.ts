import { http } from "./client";
import type { OrderRequest, OrderResponse } from "./types";

// Prices and totals are recalculated by the backend; the client sends only ids and quantities.
export const ordersApi = {
  create(req: OrderRequest): Promise<OrderResponse> {
    return http<OrderResponse>("/api/orders", { method: "POST", body: JSON.stringify(req) });
  },
};
