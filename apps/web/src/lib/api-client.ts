const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Access token (kept in localStorage so we can attach Bearer header to every
// request). Cookies (access_token + refresh_token) are also set by the API.
// ─────────────────────────────────────────────────────────────────────────────
const ACCESS_TOKEN_KEY = "cc_access_token";
export function getAccessToken(): string | null {
  try { return localStorage.getItem(ACCESS_TOKEN_KEY); } catch { return null; }
}
export function setAccessToken(t: string | null) {
  try {
    if (t) localStorage.setItem(ACCESS_TOKEN_KEY, t);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {}
}

// Single in-flight refresh — when multiple 401s happen at once, share one refresh.
let refreshInflight: Promise<string | null> | null = null;
async function silentRefresh(): Promise<string | null> {
  if (refreshInflight) return refreshInflight;
  refreshInflight = (async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      const data = await r.json().catch(() => ({} as any));
      const t = data?.data?.accessToken;
      if (typeof t === "string") {
        setAccessToken(t);
        window.dispatchEvent(new CustomEvent("cc:auth:refreshed", { detail: t }));
        return t;
      }
      return null;
    } catch {
      return null;
    } finally {
      // Allow a tiny window before another refresh can start
      setTimeout(() => { refreshInflight = null; }, 500);
    }
  })();
  return refreshInflight;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  _isRetry = false,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {};

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Attach Bearer token if present
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
    credentials: "include",
  });

  // Auto-refresh on 401 once, then retry the original request
  if (response.status === 401 && !_isRetry && path !== "/auth/refresh" && path !== "/auth/login") {
    const newToken = await silentRefresh();
    if (newToken) return request<T>(path, options, true);
  }

  const contentType = response.headers.get("content-type");
  let data;
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error?.message || `Request failed with status ${response.status}`,
      response.status,
      data?.error?.code || "UNKNOWN_ERROR"
    );
  }

  return data.data as T;
}

export async function apiGet<T>(path: string, options?: RequestInit): Promise<T> {
  return request<T>(path, { ...options, method: "GET" });
}

export async function apiPost<T>(
  path: string,
  body: any,
  options?: RequestInit
): Promise<T> {
  return request<T>(path, {
    ...options,
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export async function apiPatch<T>(
  path: string,
  body: any,
  options?: RequestInit
): Promise<T> {
  return request<T>(path, {
    ...options,
    method: "PATCH",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export async function apiDelete<T>(
  path: string,
  body?: any,
  options?: RequestInit
): Promise<T> {
  return request<T>(path, {
    ...options,
    method: "DELETE",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

export async function apiPut<T>(
  path: string,
  body: any,
  options?: RequestInit
): Promise<T> {
  return request<T>(path, {
    ...options,
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options?: RequestInit
): Promise<T> {
  return request<T>(path, {
    ...options,
    method: "POST",
    body: formData,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────────────────────────────────────
export interface SignupData {
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
}

export interface VerifyOtpData {
  email: string;
  otp: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "customer" | "vendor" | "admin" | "moderator" | "super_admin";
  emailVerified: boolean;
  hasPassword?: boolean;
  phone?: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  notificationPreferences?: string | Record<string, boolean>;
  suspended: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export const authApi = {
  signup: (data: SignupData) =>
    apiPost<{ userId: string; requiresVerification: boolean }>("/auth/signup", data),
  verifyOtp: (data: VerifyOtpData) => apiPost<AuthResponse>("/auth/verify-otp", data),
  resendOtp: (data: { email: string }) => apiPost<{ sent: boolean; expiresInMinutes: number }>("/auth/resend-otp", data),
  login: (data: LoginData) => apiPost<AuthResponse>("/auth/login", data),
  logout: () => apiPost<void>("/auth/logout", {}),
  me: () => apiGet<User>("/auth/me"),
  refresh: () => apiPost<{ accessToken: string }>("/auth/refresh", {}),
  setPassword: (newPassword: string) => apiPost<{ set: boolean }>("/auth/set-password", { newPassword }),
};

// ─────────────────────────────────────────────────────────────────────────────
// User API
// ─────────────────────────────────────────────────────────────────────────────
export interface UpdateProfileData {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  city?: string;
  state?: string;
  bio?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const userApi = {
  me: () => apiGet<User>("/users/me"),
  updateProfile: (data: UpdateProfileData) => apiPatch<User>("/users/me", data),
  changePassword: (data: ChangePasswordData) =>
    apiPost<{ success: boolean }>("/users/me/change-password", data),
  deleteAccount: () => apiDelete<{ success: boolean }>("/users/me"),
  updateNotificationPrefs: (prefs: Record<string, boolean>) =>
    apiPatch<User>("/users/me/notification-preferences", prefs),
};

// ─────────────────────────────────────────────────────────────────────────────
// Core domain types
// ─────────────────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  sortOrder?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  id: string;
  slug: string;
  businessName: string;
  description?: string;
  categoryId: string;
  category?: Category;
  city: string;
  state: string;
  logoUrl?: string;
  coverUrl?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  whatsapp?: string;
  phone?: string;
  address?: string;
  openingHours?: any;
  userId: string;
  verified: boolean;
  featured: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  hours?: Record<string, string> | null;
  yearsInBusiness?: string;
  teamSize?: string;
  priceRange?: string;
  serviceArea?: string;
  featuredUntil?: string | null;
}

export interface VendorService {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  priceMin: number;
  priceMax?: number;
  currency?: string;
  durationMinutes?: number;
  popular?: boolean;
  active: boolean;
  displayOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorProduct {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  buyLink?: string;
  images?: string[] | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorPortfolio {
  id: string;
  vendorId: string;
  imageUrl: string;
  publicId?: string;
  caption?: string;
  category?: string;
  displayOrder?: number;
  createdAt: Date;
}

export interface VendorReview {
  id: string;
  vendorId: string;
  userId: string;
  rating: number;
  comment?: string;
  content?: string;
  user?: { id: string; name: string; avatarUrl?: string | null };
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Booking types
// ─────────────────────────────────────────────────────────────────────────────
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  customerId: string;
  vendorId: string;
  serviceId: string;
  scheduledFor: string;
  status: BookingStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes?: string;
  vendorNotes?: string;
  createdAt: string;
  updatedAt: string;
  serviceName?: string;
  service?: VendorService;
  customer?: { id: string; name: string; email: string; avatarUrl?: string };
  vendor?: { id: string; businessName: string; slug: string; logoUrl?: string };
}

export interface BookingListResponse {
  bookings: Booking[];
  total: number;
  page: number;
  pages: number;
}

export interface CreateBookingData {
  vendorId: string;
  serviceId: string;
  scheduledFor: string; // ISO datetime string
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Saved / Follow types  (items are vendor fields + savedAt/followedAt)
// ─────────────────────────────────────────────────────────────────────────────
export type SavedVendor = Vendor & { savedAt: string };
export type FollowedVendor = Vendor & { followedAt: string };

export interface SavedListResponse {
  saved: SavedVendor[];
  total: number;
  page: number;
  pages: number;
}

export interface FollowListResponse {
  follows: FollowedVendor[];
  total: number;
  page: number;
  pages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Review types
// ─────────────────────────────────────────────────────────────────────────────
export interface MyReview {
  id: string;
  vendorId: string;
  userId: string;
  bookingId?: string;
  rating: number;
  content?: string;
  photos?: string[] | null;
  vendorReply?: string | null;
  vendorReplyAt?: string | null;
  helpfulCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification types
// ─────────────────────────────────────────────────────────────────────────────
export type NotificationType = "message" | "review" | "booking" | "payment" | "subscription" | "announcement" | "follow";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  data?: Record<string, string> | null; // extra payload (e.g. conversationId)
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Vendor API
// ─────────────────────────────────────────────────────────────────────────────
export interface VendorListParams {
  category?: string;
  state?: string;
  city?: string;
  q?: string;
  sort?: "featured" | "rating" | "newest";
  page?: number;
  limit?: number;
  featured?: boolean;
  verified?: boolean;
}

export const vendorApi = {
  list: (params?: VendorListParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    return apiGet<{ vendors: Vendor[], total: number, page: number, pages: number }>(`/vendors?${query.toString()}`);
  },
  getBySlug: (slug: string) => apiGet<Vendor & {
    services: VendorService[];
    products: VendorProduct[];
    portfolioShots: VendorPortfolio[];
    reviewsSummary: { averageRating: number; reviewCount: number };
    category?: Category;
    user?: { id: string; name: string; avatarUrl?: string };
  }>(`/vendors/${slug}`),
  getMyVendor: () => apiGet<Vendor>("/vendors/me"),
  create: (data: any) => apiPost<Vendor>("/vendors", data),
  update: (id: string, data: any) => apiPatch<Vendor>(`/vendors/${id}`, data),
  getServices: (vendorId: string) => apiGet<VendorService[]>(`/vendors/${vendorId}/services`),
  getProducts: (vendorId: string) => apiGet<VendorProduct[]>(`/vendors/${vendorId}/products`),
  getPortfolio: (vendorId: string) => apiGet<VendorPortfolio[]>(`/vendors/${vendorId}/portfolio`),
  getReviews: (vendorId: string) => apiGet<VendorReview[]>(`/vendors/${vendorId}/reviews`),
  save: (vendorId: string) => apiPost<void>(`/vendors/${vendorId}/save`, {}),
  unsave: (vendorId: string) => apiDelete<void>(`/vendors/${vendorId}/save`),
  follow: (vendorId: string) => apiPost<void>(`/vendors/${vendorId}/follow`, {}),
  unfollow: (vendorId: string) => apiDelete<void>(`/vendors/${vendorId}/follow`),
  // Fire-and-forget; failures are silently ignored — analytics only.
  trackView: (vendorId: string) =>
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/vendors/${vendorId}/track-view`, {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined),
  getViewStats: (vendorId: string) =>
    apiGet<{ totalViews: number; last7Days: number; byDay: { day: string; count: number }[] }>(`/vendors/${vendorId}/view-stats`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Payments / Subscriptions
// ─────────────────────────────────────────────────────────────────────────────
export interface Plan {
  id: "monthly" | "3month" | "6month" | "12month";
  name: string;
  amountNgn: number;
  currency: string;
  interval: string;
}

export interface Subscription {
  id: string;
  vendorId: string;
  plan: Plan["id"];
  status: "active" | "expired" | "cancelled" | "pending";
  startsAt: string;
  expiresAt: string;
  autoRenew: boolean;
}

export const paymentApi = {
  plans: () => apiGet<{ plans: Plan[] }>("/payments/plans"),
  subscribe: (plan: Plan["id"]) =>
    apiPost<{ authorizationUrl: string; reference: string }>("/payments/subscribe", { plan }),
  verify: (reference: string) =>
    apiGet<{ status: string }>(`/payments/verify?reference=${encodeURIComponent(reference)}`),
  mySubscriptions: () => apiGet<{ subscriptions: Subscription[] } | Subscription[]>("/payments/my-subscriptions"),
  cancel: (id: string) => apiPost<{ success: boolean }>(`/payments/subscriptions/${id}/cancel`, {}),
};

// ─────────────────────────────────────────────────────────────────────────────
// Category API
// ─────────────────────────────────────────────────────────────────────────────
export interface CategoryDetail {
  category: Category & { vendorCount: number };
  featuredVendors: Vendor[];
  recentVendors: Vendor[];
}

export const categoryApi = {
  list: () => apiGet<Category[]>("/categories"),
  getBySlug: (slug: string) => apiGet<CategoryDetail>(`/categories/${slug}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Search API
// ─────────────────────────────────────────────────────────────────────────────
export interface SearchVendorsParams {
  q?: string;
  category?: string;
  state?: string;
  city?: string;
  sort?: "featured" | "rating" | "newest";
}

export const searchApi = {
  searchVendors: (params: SearchVendorsParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.append(key, String(value));
        }
      });
    }
    return apiGet<{ vendors: Vendor[], total: number, page: number, pages: number }>(`/search/vendors?${query.toString()}`);
  },
  getTrending: () => apiGet<Vendor[]>("/search/trending"),
};

// ─────────────────────────────────────────────────────────────────────────────
// Review API
// ─────────────────────────────────────────────────────────────────────────────
export interface CreateReviewData {
  rating: number;
  content?: string;
  comment?: string;
  photos?: string[];
}

export const reviewApi = {
  create: (vendorId: string, data: CreateReviewData) =>
    apiPost<VendorReview>(`/vendors/${vendorId}/reviews`, data),
  listForVendor: (vendorId: string) =>
    apiGet<VendorReview[]>(`/vendors/${vendorId}/reviews`),
  listMine: () => apiGet<MyReview[]>("/reviews/me"),
  update: (id: string, data: { rating?: number; content?: string }) =>
    apiPatch<MyReview>(`/reviews/${id}`, data),
  delete: (id: string) => apiDelete<void>(`/reviews/${id}`),
  reply: (id: string, content: string) =>
    apiPost<MyReview>(`/reviews/${id}/reply`, { content }),
  toggleHelpful: (id: string) => apiPost<MyReview>(`/reviews/${id}/helpful`, {}),
};

// ─────────────────────────────────────────────────────────────────────────────
// Booking API
// ─────────────────────────────────────────────────────────────────────────────
export interface BookingQueryParams {
  status?: BookingStatus;
  type?: "upcoming" | "past" | "all";
  page?: number;
  limit?: number;
}

export const bookingApi = {
  list: (params?: BookingQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
    }
    return apiGet<BookingListResponse>(`/bookings/me?${query.toString()}`);
  },
  create: (data: CreateBookingData) => apiPost<Booking>("/bookings", data),
  getById: (id: string) => apiGet<Booking>(`/bookings/${id}`),
  updateStatus: (id: string, data: { status: BookingStatus; vendorNotes?: string }) =>
    apiPatch<Booking>(`/bookings/${id}/status`, data),
};

// ─────────────────────────────────────────────────────────────────────────────
// Saved API
// ─────────────────────────────────────────────────────────────────────────────
export const savedApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return apiGet<SavedListResponse>(`/saved?${query.toString()}`);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Follow API
// ─────────────────────────────────────────────────────────────────────────────
export const followApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return apiGet<FollowListResponse>(`/follows?${query.toString()}`);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Notification API
// ─────────────────────────────────────────────────────────────────────────────
export interface NotificationQueryParams {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export const notificationApi = {
  list: (params?: NotificationQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return apiGet<NotificationListResponse>(`/users/me/notifications?${query.toString()}`);
  },
  markRead: (id: string) =>
    apiPatch<{ success: boolean }>(`/users/me/notifications/${id}/read`, {}),
  markAllRead: () =>
    apiPost<{ success: boolean }>("/users/me/notifications/read-all", {}),
};

// ─────────────────────────────────────────────────────────────────────────────
// Vendor extended APIs (Phase 4)
// ─────────────────────────────────────────────────────────────────────────────

export interface FullVendor extends Vendor {
  services: VendorService[];
  products: VendorProduct[];
  portfolioShots: VendorPortfolio[];
  reviewsSummary: { averageRating: number; reviewCount: number };
  user?: { id: string; name: string; avatarUrl?: string };
  totalViews?: number;
  totalSaves?: number;
  totalFollowers?: number;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: string | null;
  featuredUntil?: string | null;
  hours?: Record<string, string> | null;
  yearsInBusiness?: string;
  teamSize?: string;
  priceRange?: string;
  serviceArea?: string;
}

export interface UpdateVendorData {
  businessName?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  address?: string;
  city?: string;
  state?: string;
  hours?: Record<string, string>;
  priceRange?: string;
  yearsInBusiness?: string;
  teamSize?: string;
  serviceArea?: string;
  logoUrl?: string;
  coverUrl?: string;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  priceMin: number;
  priceMax?: number;
  durationMinutes?: number;
  popular?: boolean;
  displayOrder?: number;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  buyLink?: string;
  images?: string[];
}

export interface VendorAnalytics {
  profileViews: number;
  searchAppearances: number;
  ctr: number;
  topServices: { name: string; inquiries: number }[];
  earningsChart: { date: string; amount: number }[];
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "customer" | "vendor";
  content: string;
  type: string;
  attachmentUrl?: string | null;
  readAt?: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  vendorId: string;
  lastMessageAt: string;
  customerUnread: number;
  vendorUnread: number;
  endedAt?: string | null;
  createdAt: string;
  customer?: { id: string; name: string; avatarUrl?: string | null };
  vendor?: { id: string; slug: string; businessName: string; logoUrl?: string | null };
  lastMessage?: ConversationMessage | null;
}

export interface VendorReviewFull {
  id: string;
  bookingId?: string;
  rating: number;
  content: string;
  photos?: string[] | null;
  vendorReply?: string | null;
  helpfulCount?: number;
  reported?: boolean;
  hidden?: boolean;
  createdAt: string;
  user: { id: string; name: string; avatarUrl?: string | null };
}

// ─────────────────────────────────────────────────────────────────────────────
// Services API
// ─────────────────────────────────────────────────────────────────────────────
export const servicesApi = {
  list: (vendorId: string) =>
    apiGet<VendorService[]>(`/vendors/${vendorId}/services`),
  create: (vendorId: string, data: CreateServiceData) =>
    apiPost<VendorService>(`/vendors/${vendorId}/services`, data),
  update: (id: string, data: Partial<CreateServiceData>) =>
    apiPatch<VendorService>(`/services/${id}`, data),
  delete: (id: string) => apiDelete<void>(`/services/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Products API
// ─────────────────────────────────────────────────────────────────────────────
export const productsApi = {
  list: (vendorId: string) =>
    apiGet<VendorProduct[]>(`/vendors/${vendorId}/products`),
  create: (vendorId: string, data: CreateProductData) =>
    apiPost<VendorProduct>(`/vendors/${vendorId}/products`, data),
  update: (id: string, data: Partial<CreateProductData>) =>
    apiPatch<VendorProduct>(`/products/${id}`, data),
  delete: (id: string) => apiDelete<void>(`/products/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Portfolio API
// ─────────────────────────────────────────────────────────────────────────────
export const portfolioApi = {
  list: (vendorId: string, params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) query.append(k, String(v));
      });
    }
    return apiGet<{ portfolioShots: VendorPortfolio[]; total: number; page: number; pages: number }>(
      `/vendors/${vendorId}/portfolio?${query.toString()}`
    );
  },
  upload: (vendorId: string, file: File, caption?: string) => {
    const fd = new FormData();
    fd.append("image", file);
    if (caption) fd.append("caption", caption);
    return apiUpload<VendorPortfolio>(`/vendors/${vendorId}/portfolio`, fd);
  },
  delete: (id: string) => apiDelete<void>(`/portfolio/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Conversation API
// ─────────────────────────────────────────────────────────────────────────────
export const conversationApi = {
  list: () =>
    apiGet<{ conversations: Conversation[] }>("/conversations"),
  findOrCreate: (vendorId: string) =>
    apiPost<{ conversation: Conversation }>("/conversations", { vendorId }),
  getById: (id: string) =>
    apiGet<{ conversation: Conversation; messages: ConversationMessage[] }>(`/conversations/${id}`),
  getMessages: (id: string) =>
    apiGet<{ messages: ConversationMessage[] }>(`/conversations/${id}/messages`),
  sendMessage: (id: string, content: string) =>
    apiPost<ConversationMessage>(`/conversations/${id}/messages`, { content }),
  markRead: (id: string) =>
    apiPatch<{ success: boolean }>(`/conversations/${id}/read`, {}),
  end: (id: string) =>
    apiPost<{ success: boolean }>(`/conversations/${id}/end`, {}),
  exportChat: async (id: string) => {
    const token = localStorage.getItem("cc_access_token");
    const res = await fetch(`${API_BASE_URL}/conversations/${id}/export`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Export failed (${res.status}): ${text.slice(0, 120)}`);
    }
    return { text: await res.text() };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Upload API (returns URL strings)
// ─────────────────────────────────────────────────────────────────────────────
export const uploadApi = {
  images: async (files: FormData) => {
    const res = await fetch(`${API_BASE_URL}/uploads/images`, {
      method: "POST",
      body: files,
      credentials: "include",
      headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` },
    });
    if (!res.ok) throw new ApiError(`Upload failed`, res.status, "UPLOAD_FAILED");
    const data = await res.json();
    return { urls: data?.data?.urls ?? [] as string[] };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Analytics API
// ─────────────────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getVendorAnalytics: () => apiGet<VendorAnalytics>("/analytics/vendor/me"),
};

// ─────────────────────────────────────────────────────────────────────────────
// Vendor reviews (full shape with user join)
// ─────────────────────────────────────────────────────────────────────────────
export interface VendorReviewListResponse {
  reviews: VendorReviewFull[];
  total: number;
  page: number;
  pages: number;
}

export const vendorReviewApi = {
  listForVendor: (vendorId: string) =>
    apiGet<VendorReviewListResponse>(`/vendors/${vendorId}/reviews`),
  reply: (id: string, content: string) =>
    apiPost<VendorReviewFull>(`/reviews/${id}/reply`, { content }),
};

// Extend vendorApi with my-vendor mutation helpers
export const myVendorApi = {
  get: () => apiGet<FullVendor>("/vendors/me"),
  update: (id: string, data: UpdateVendorData) =>
    apiPatch<Vendor>(`/vendors/${id}`, data),
  uploadLogo: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("logo", file);
    return apiUpload<{ logoUrl: string }>(`/vendors/${id}/logo`, fd);
  },
  uploadCover: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("cover", file);
    return apiUpload<{ coverUrl: string }>(`/vendors/${id}/cover`, fd);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin types (Phase 5)
// ─────────────────────────────────────────────────────────────────────────────
export interface PlatformStats {
  users: {
    total: number;
    byRole: Record<string, number>;
  };
  vendors: {
    total: number;
    byStatus: Record<string, number>;
  };
  bookings: number;
  reviews: number;
  payments: { count: number };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  suspended: boolean;
  city?: string;
  state?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminVendorItem {
  id: string;
  businessName: string;
  slug: string;
  city: string;
  state: string;
  subscriptionStatus: string;
  verified: boolean;
  featured: boolean;
  logoUrl?: string;
  categoryId?: string;
  averageRating?: number;
  reviewCount?: number;
  totalViews?: number;
  createdAt: string;
}

export interface AdminVendorListResponse {
  vendors: AdminVendorItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminFaq {
  id: string;
  question: string;
  answer: string;
  category?: string;
  displayOrder?: number;
  active?: boolean;
  createdAt?: string;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  type?: string;
  active?: boolean;
  expiresAt?: string;
  createdAt?: string;
}

export interface PlatformSettings {
  pricing?: Record<string, number | string>;
  features?: Record<string, boolean | string>;
  limits?: Record<string, number>;
  subscription?: Record<string, any>;
  chat?: Record<string, any>;
  content?: Record<string, string>;
  [key: string]: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin API
// ─────────────────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () => apiGet<PlatformStats>("/admin/stats"),
  listUsers: (params?: { role?: string; q?: string; page?: number; limit?: number; suspended?: boolean }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) query.append(k, String(v));
      });
    }
    return apiGet<AdminUserListResponse>(`/admin/users?${query.toString()}`);
  },
  listVendors: (params?: { q?: string; page?: number; limit?: number; status?: string; verified?: boolean; featured?: boolean }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) query.append(k, String(v));
      });
    }
    return apiGet<AdminVendorListResponse>(`/admin/vendors?${query.toString()}`);
  },
  listPendingVendors: () =>
    apiGet<{ vendors: AdminVendorItem[] }>("/admin/vendors/pending"),
  bulkApproveVendors: (vendorIds: string[]) =>
    apiPost<{ vendors: AdminVendorItem[] }>("/admin/vendors/bulk-approve", { vendorIds }),
  updateVendor: (id: string, data: Record<string, any>) =>
    apiPatch<AdminVendorItem>(`/admin/vendors/${id}`, data),
  suspendVendor: (id: string, reason: string) =>
    apiDelete<AdminVendorItem>(`/admin/vendors/${id}`, { reason }),
  suspendUser: (id: string, reason: string) =>
    apiPatch<AdminUser>(`/admin/users/${id}/suspend`, { reason }),
  unsuspendUser: (id: string) =>
    apiPatch<AdminUser>(`/admin/users/${id}/unsuspend`, {}),
  listFaqs: () => apiGet<AdminFaq[]>("/admin/faqs"),
  createFaq: (data: { question: string; answer: string; category?: string; displayOrder?: number }) =>
    apiPost<AdminFaq>("/admin/faqs", data),
  updateFaq: (id: string, data: Partial<AdminFaq>) =>
    apiPatch<AdminFaq>(`/admin/faqs/${id}`, data),
  deleteFaq: (id: string) => apiDelete<void>(`/admin/faqs/${id}`),
  listAnnouncements: () => apiGet<AdminAnnouncement[]>("/admin/announcements"),
  createAnnouncement: (data: { title: string; body: string; type?: string }) =>
    apiPost<AdminAnnouncement>("/admin/announcements", data),
  getSystemHealth: () => apiGet<Record<string, any>>("/admin/system-health"),
};

// ─────────────────────────────────────────────────────────────────────────────
// Settings API
// ─────────────────────────────────────────────────────────────────────────────
export const settingsApi = {
  getPublicSettings: () => apiGet<PlatformSettings>("/settings"),
  getAllSettings: () => apiGet<PlatformSettings>("/admin/settings"),
  updateSettings: (category: string, updates: Record<string, any>) =>
    apiPut<PlatformSettings>("/admin/settings", { category, updates }),
};
