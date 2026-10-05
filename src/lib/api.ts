export type Product = {
  id: string;
  name: string;
  category: string;
  origin: string;
  unit: string;
  price: number;
  mrp: number;
  note: string;
  stock: number;
};

type ApiProduct = {
  id: number;
  name: string;
  category: string;
  description: string | null;
  origin: string | null;
  pack_size: string | null;
  price: number | string;
  original_price: number | string;
  discount_percentage: number;
  stock: number;
};

export type ProductInput = {
  category: string;
  name: string;
  description: string;
  origin: string;
  packSize: string;
  price: number;
  originalPrice: number;
  discountPercentage?: number;
  stock?: number;
};

export type CartItem = {
  productId: number;
  quantity: number;
  category: string;
  name: string;
  description: string | null;
  origin: string | null;
  packSize: string | null;
  price: number | string;
  originalPrice: number | string;
  discountPercentage: number;
  itemTotal: number | string;
};

export type Cart = {
  items: CartItem[];
  subtotal: number;
  delivery: number;
  total: number;
};

export type OrderInput = {
  sessionId: string;
  fullName: string;
  mobile: string;
  email?: string;
  deliveryAddress: string;
  city: string;
  state: string;
  pinCode: string;
  paymentMode: "UPI" | "Card" | "Net Banking" | "Cash on Delivery";
  deliveryNotes?: string;
};

export type OrderStatus =
  "Pending" | "Confirmed" | "Processing" | "Dispatched" | "Delivered" | "Cancelled";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "customer" | "admin";
};

export type AdminOrder = {
  id: number;
  full_name: string;
  mobile: string;
  email: string | null;
  total: number | string;
  status: OrderStatus;
  created_at: string;
};

export type CustomerOrder = {
  id: number;
  created_at: string;
  total: number | string;
  status: OrderStatus;
  payment_mode: OrderInput["paymentMode"];
  items: string | null;
};

export type PaginationMetadata = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  count: number;
  data: T[];
  pagination: PaginationMetadata;
};

type PaginationRequest = {
  page?: number;
  pageSize?: number;
};

type ApiMessage = {
  success: boolean;
  message?: string;
};

type ApiResponse<T> = ApiMessage & {
  data: T;
};

const API_BASE = (import.meta.env["VITE_API_URL"] || "/api").replace(/\/$/, "");
const AUTH_TOKEN_KEY = "organic-zone-auth-token";

export function getAuthToken() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const token = getAuthToken();
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error("Could not reach the store. Check that the backend is running.");
  }

  const payload = (await response.json().catch(() => ({}))) as Partial<ApiMessage> & {
    message?: string;
  };
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${response.status})`);
  }
  return payload as T;
}

function mapProduct(product: ApiProduct): Product {
  return {
    id: String(product.id),
    name: product.name,
    category: product.category,
    origin: product.origin || "",
    unit: product.pack_size || "",
    price: Number(product.price),
    mrp: Number(product.original_price),
    note: product.description || "",
    stock: Number(product.stock),
  };
}

export const api = {
  register(name: string, email: string, password: string) {
    return request<ApiResponse<{ token: string; user: AuthUser }>>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  login(email: string, password: string) {
    return request<ApiResponse<{ token: string; user: AuthUser }>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  getCurrentUser() {
    return request<ApiResponse<AuthUser>>("/auth/me");
  },

  async getProducts({
    category,
    page = 1,
    pageSize = 12,
  }: PaginationRequest & { category?: string } = {}) {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (category) query.set("category", category);
    const result = await request<ApiMessage & PaginatedResult<ApiProduct>>(`/products?${query}`);
    return {
      ...result,
      data: result.data.map(mapProduct),
    };
  },

  getProductCategories() {
    return request<ApiResponse<string[]>>("/products/categories");
  },

  async getProduct(id: number | string) {
    const result = await request<ApiResponse<ApiProduct>>(`/products/${id}`);
    return mapProduct(result.data);
  },

  createProduct(input: ProductInput) {
    return request<ApiMessage & { productId: number }>("/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateProduct(id: number | string, input: ProductInput) {
    return request<ApiMessage & { affectedRows: number }>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  deleteProduct(id: number | string) {
    return request<ApiMessage>(`/products/${id}`, { method: "DELETE" });
  },

  async getCart(sessionId: string) {
    const result = await request<ApiResponse<Cart>>(`/cart/${encodeURIComponent(sessionId)}`);
    return result.data;
  },

  addToCart(sessionId: string, productId: number, quantity = 1) {
    return request<ApiMessage>("/cart", {
      method: "POST",
      body: JSON.stringify({ sessionId, productId, quantity }),
    });
  },

  updateCartQuantity(sessionId: string, productId: number, quantity: number) {
    return request<ApiMessage>(`/cart/${encodeURIComponent(sessionId)}/${productId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
  },

  removeFromCart(sessionId: string, productId: number) {
    return request<ApiMessage>(`/cart/${encodeURIComponent(sessionId)}/${productId}`, {
      method: "DELETE",
    });
  },

  clearCart(sessionId: string) {
    return request<ApiMessage>(`/cart/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
  },

  createOrder(input: OrderInput) {
    return request<
      ApiResponse<{
        orderId: number;
        subtotal: number;
        deliveryCharge: number;
        total: number;
        status: OrderStatus;
      }>
    >("/orders", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getOrders({ page = 1, pageSize = 10 }: PaginationRequest = {}) {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return request<ApiMessage & PaginatedResult<AdminOrder>>(`/orders?${query}`);
  },

  getMyOrders({ page = 1, pageSize = 10 }: PaginationRequest = {}) {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return request<ApiMessage & PaginatedResult<CustomerOrder>>(`/orders/mine?${query}`);
  },

  getOrder(id: number | string) {
    return request<
      ApiResponse<{ order: Record<string, unknown>; items: Record<string, unknown>[] }>
    >(`/orders/${id}`);
  },

  updateOrderStatus(id: number | string, status: OrderStatus) {
    return request<ApiMessage>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

export function getOrCreateSessionId() {
  const storageKey = "organic-zone-session-id";
  let sessionId = window.localStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = window.crypto.randomUUID();
    window.localStorage.setItem(storageKey, sessionId);
  }
  return sessionId;
}
