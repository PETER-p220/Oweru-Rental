// API service for connecting to Laravel backend
function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const isLocalDev = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
    // Production SPA is served by the same nginx host as /api — always use same origin.
    if (!isLocalDev) {
      return origin.replace(/\/$/, '');
    }
  }

  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).replace(/\/$/, '');
  }

  return 'http://localhost:8000';
}

const API_BASE_URL = resolveApiBaseUrl();

// ── The single source of truth for the token key ──────────────────────────────
export const TOKEN_KEY = 'token';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  already_saved?: boolean;
}

export interface DashboardStats {
  totalProperties: number;
  savedProperties: number;
  totalApplications: number;
  messages: number;
  activeTenants?: number;
  monthlyRevenue?: number;
  totalRevenue?: number;
  occupancyRate?: number;
}


export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  user_type: 'tenant' | 'landlord' | 'agent' | 'admin' | 'bnb_owner' | 'commercial';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Optional fields that may be added by frontend mapping
  role?: string;
  status?: string;
  registrationDate?: string;
  lastLogin?: string;
  propertiesCount?: number;
  transactionsCount?: number;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  profileCompleted?: boolean;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  address: string;
  type: string;
  property_type: 'rental' | 'bnb';
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  owner_id: number;
  status: 'available' | 'occupied' | 'maintenance';
  created_at: string;
  updated_at: string;
  bnb_details?: {
    max_guests: number;
    min_stay: number;
    instant_book: boolean;
    cancellation_policy: string;
    house_rules: string[];
    check_in_time: string;
    check_out_time: string;
    cleaning_fee: number;
    service_fee: number;
    security_deposit: number;
    weekly_discount: number;
    monthly_discount: number;
    amenities_bnb: {
      wifi: boolean;
      kitchen: boolean;
      parking: boolean;
      pool: boolean;
      gym: boolean;
      ac: boolean;
      heating: boolean;
      workspace: boolean;
      tv: boolean;
      washer: boolean;
    };
    location_highlights: string[];
    safety_items: string[];
  };
  agent?: { id: number; firstName: string; lastName: string; commission: number };
  dalali?: string;
  tracking_code?: string;
  featured: boolean;
  available: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: { id: number; firstName: string; lastName: string; email: string; phone: string; userType: string };
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface LoginResponse {
  message: string;
  data: {
    user: User;
    token: string;
  };
}



class Api {
  private static unauthorizedHandler: (() => void) | null = null;
  private static handlingUnauthorized = false;
  private static sessionCheckPromise: Promise<boolean> | null = null;

  static setUnauthorizedHandler(handler: (() => void) | null) {
    this.unauthorizedHandler = handler;
  }

  private static endpointPath(endpoint: string): string {
    return endpoint.split('?')[0];
  }

  private static isPublicAuthEndpoint(endpoint: string): boolean {
    return /^(login|register|logout|auth\/|check-email)/.test(this.endpointPath(endpoint));
  }

  /** Public read endpoints — never attach Bearer token (stale tokens must not break browsing). */
  private static isPublicDataEndpoint(endpoint: string): boolean {
    return this.endpointPath(endpoint).startsWith('public/');
  }

  /** Confirm the stored token is rejected before clearing the whole session. */
  private static async isSessionExpired(): Promise<boolean> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return true;

    if (!this.sessionCheckPromise) {
      this.sessionCheckPromise = (async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/user`, {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
              'X-Requested-With': 'XMLHttpRequest',
            },
          });
          return res.status === 401;
        } catch {
          // Network blip — keep the session; the page can retry.
          return false;
        } finally {
          window.setTimeout(() => {
            this.sessionCheckPromise = null;
          }, 3000);
        }
      })();
    }

    return this.sessionCheckPromise;
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}/api/${endpoint}`;

    const isFormData = options.body instanceof FormData;
    const isPublicData = this.isPublicDataEndpoint(endpoint);

    const defaultHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    if (!isFormData) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    // Public listings/details work without auth — omit Bearer so expired tokens cannot break them.
    if (!isPublicData) {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw {
        response: {
          data: { message: 'Request failed before reaching the server.' },
          status: 0,
        },
      };
    }

    if (!response.ok) {
      let errorBody: any = {};
      try { errorBody = await response.json(); } catch { /* ignore */ }

      if (
        response.status === 401
        && !this.isPublicAuthEndpoint(endpoint)
        && !isPublicData
        && !this.handlingUnauthorized
      ) {
        this.handlingUnauthorized = true;
        try {
          const expired = await this.isSessionExpired();
          if (expired) {
            this.unauthorizedHandler?.();
          }
        } finally {
          this.handlingUnauthorized = false;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw { response: { data: errorBody, status: response.status } };
    }

    const data = await response.json();
    return {
      data: data.data ?? data,
      message: data.message,
      status: response.status,
    };
  }

  // ── Auth ────────────────────────────────────────────────────────────────────

  static async login(email: string, password: string, userType?: string) {
    const body: Record<string, string> = {
      email: email.trim().toLowerCase(),
      password,
    };
    if (userType) body.user_type = userType;
    return this.request<LoginResponse>('login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  static async checkEmailAvailability(email: string) {
    const q = encodeURIComponent(email.trim().toLowerCase());
    return this.request<{ available: boolean; reason?: string; message?: string }>(
      `auth/check-email?email=${q}`,
    );
  }

  static async register(userData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    user_type: string;
  }) {
    return this.request<RegisterResponse>('register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async logout() {
    return this.request('logout', { method: 'POST' });
  }

  static getGoogleAuthUrl(userType?: string) {
    const qs = userType ? `?user_type=${encodeURIComponent(userType)}` : '';
    return `${API_BASE_URL}/api/auth/google/redirect${qs}`;
  }

  static getGoogleRegisterUrl(userType: string) {
    return `${API_BASE_URL}/api/auth/google/register/redirect?user_type=${userType}`;
  }

  static async getUser() {
    return this.request<User>('user');
  }

  // ── Admin – Users ───────────────────────────────────────────────────────────

  static async getUsers(filters?: { search?: string; user_type?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.search)    params.append('search',    filters.search);
    if (filters?.user_type) params.append('user_type', filters.user_type);
    if (filters?.status)    params.append('status',    filters.status);
    const qs = params.toString();
    return this.request<any[]>(`admin/users${qs ? `?${qs}` : ''}`);
  }

  static async getUserStats() {
    return this.request<any>('admin/users/stats');
  }

  static async getActiveSessions() {
    return this.request<any[]>('admin/users/active-sessions');
  }

  static async getUserActivity(userId: number) {
    return this.request<any>(`admin/users/${userId}/activity`);
  }

  static async getActivityLogs(params?: { search?: string; action?: string; user_id?: number; per_page?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.action) query.set('action', params.action);
    if (params?.user_id) query.set('user_id', String(params.user_id));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    const qs = query.toString();
    return this.request<any>(`admin/activity-logs${qs ? `?${qs}` : ''}`);
  }

  static async createUser(userData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    user_type: string;
    password: string;
    status?: string;
    notes?: string;
  }) {
    return this.request<any>('admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async updateUser(userId: number, userData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    user_type?: string;
    status?: string;
    password?: string;
    notes?: string;
  }) {
    return this.request<any>(`admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  static async deleteUser(userId: number) {
    return this.request<any>(`admin/users/${userId}`, { method: 'DELETE' });
  }

  static async updateUserStatus(userId: number, status: string) {
    return this.request<any>(`admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ── Admin – Properties ──────────────────────────────────────────────────────

  static async getAdminProperties(filters?: {
    search?: string; type?: string; status?: string;
    min_price?: number; max_price?: number;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.request<any[]>(`admin/properties${params ? `?${params}` : ''}`);
  }
  static async createAdminProperty(data: any) { return this.request<any>('admin/properties', { method: 'POST', body: JSON.stringify(data) }); }
  static async updateAdminProperty(id: number, data: any) { return this.request<any>(`admin/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  static async deleteAdminProperty(id: number) { return this.request<any>(`admin/properties/${id}`, { method: 'DELETE' }); }

  static async getAdminPropertyStats() {
    return this.request<any>('admin/properties/stats');
  }

  // ── Admin – Transactions ────────────────────────────────────────────────────

  static async getAdminTransactions(filters?: {
    search?: string;
    type?: string;
    status?: string;
    payment_method?: string;
    source?: string;
    date_from?: string;
    date_to?: string;
    amount_min?: number | string;
    amount_max?: number | string;
    sort_by?: string;
    sort_order?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          params.set(key, String(value));
        }
      });
    }
    const qs = params.toString();
    return this.request<any[]>(`admin/transactions${qs ? `?${qs}` : ''}`);
  }

  static async getAdminTransactionStats() {
    return this.request<any>('admin/transactions/stats');
  }

  // ── Admin – Payments ──────────────────────────────────────────────────────

  static async getAdminPayments(filters?: {
    search?: string; type?: string; status?: string;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.request<any[]>(`admin/payments${params ? `?${params}` : ''}`);
  }

  static async getAdminPaymentStats() {
    return this.request<any>('admin/payments/stats');
  }

  static async updateAdminTransactionStatus(transactionId: number, status: string) {
    return this.request<any>(`admin/transactions/${transactionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  static async deleteAdminTransaction(transactionId: number) {
    return this.request<any>(`admin/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  }

  static async getAdminContracts() {
    return this.request<any[]>('admin/contracts');
  }

  static async getAdminContractStats() {
    return this.request<any>('admin/contracts/stats');
  }

  // ── Admin – Commission ──────────────────────────────────────────────────────

  static async getCommissionRules()    { return this.request<any[]>('admin/commission/rules'); }
  static async getCommissionDistribution() { return this.request<any>('admin/commission/distribution'); }
  static async getCommissionPayments() { return this.request<any[]>('admin/commission/payments'); }
  static async getCommissionStats()    { return this.request<any>('admin/commission/stats'); }
  static async updateCommissionPaymentStatus(id: number, status: string) {
    return this.request<any>(`admin/commission/payments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  static async getCommissionReportPreview(date?: string) {
    const q = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request<any>(`admin/commission/reports/preview${q}`);
  }

  static async downloadCommissionReportPdf(date?: string): Promise<Blob> {
    const q = date ? `?date=${encodeURIComponent(date)}` : '';
    const url = `${API_BASE_URL}/api/admin/commission/reports/pdf${q}`;
    const token = localStorage.getItem(TOKEN_KEY);
    const response = await fetch(url, {
      headers: {
        Accept: 'application/pdf',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      let errorBody: any = {};
      try { errorBody = await response.json(); } catch { /* ignore */ }
      throw { response: { data: errorBody, status: response.status } };
    }
    return response.blob();
  }

  static async sendCommissionReportEmail(date?: string) {
    return this.request<any>('admin/commission/reports/send', {
      method: 'POST',
      body: JSON.stringify(date ? { date } : {}),
    });
  }

  // ── Admin – Settings ────────────────────────────────────────────────────────

  static async getSystemSettings() {
    return this.request<any>('admin/settings');
  }

  static async updateSystemSettings(settings: any) {
    return this.request<any>('admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ── Admin – Verification ────────────────────────────────────────────────────

  static async getVerificationRequests(filters?: {
    search?: string; type?: string; status?: string;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.request<any[]>(`admin/verification/requests${params ? `?${params}` : ''}`);
  }

  static async getVerificationStats() {
    return this.request<any>('admin/verification/stats');
  }

  static async updateVerificationStatus(requestId: number, status: string, reason?: string) {
    return this.request<any>(`admin/verification/requests/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  // ── Admin – Alerts ──────────────────────────────────────────────────────────

  static async getAlerts(filters?: {
    search?: string; type?: string; severity?: string; status?: string;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.request<any[]>(`admin/alerts${params ? `?${params}` : ''}`);
  }

  static async getAlertStats() {
    return this.request<any>('admin/alerts/stats');
  }

  static async updateAlertStatus(alertId: number, status: string, reason?: string) {
    return this.request<any>(`admin/alerts/${alertId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  }

  // ── BNB Owner Methods ───────────────────────────────────────────────────────

  static async getBnbProperties(filters?: {
    search?: string; location?: string; max_guests?: number; min_price?: number; max_price?: number; status?: string;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.request<any[]>(`bnb/properties${params ? `?${params}` : ''}`);
  }

  static async getBnbProperty(id: number) {
    return this.request<any>(`bnb/properties/${id}`);
  }

  static async createBnbProperty(data: any) {
    return this.request<any>('bnb/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateBnbProperty(id: number, data: any) {
    return this.request<any>(`bnb/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async getBnbBookings(params?: { search?: string; status?: string; property_id?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.search)      queryParams.append('search',      params.search);
    if (params?.status)      queryParams.append('status',      params.status);
    if (params?.property_id) queryParams.append('property_id', params.property_id.toString());

    const url = `bnb/bookings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<any[]>(url);
  }

  // ── NEW: Update BNB booking status (used by BnbBookings component) ──────────
  static async updateBnbBookingStatus(bookingId: number, status: string, cancellationReason?: string) {
    return this.request<any>(`bnb/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...(cancellationReason ? { cancellation_reason: cancellationReason } : {}),
      }),
    });
  }

  static async getBnbReviews(params?: { search?: string; rating?: string; property_id?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.search)      queryParams.append('search',      params.search);
    if (params?.rating)      queryParams.append('rating',      params.rating);
    if (params?.property_id) queryParams.append('property_id', params.property_id.toString());

    const url = `bnb/reviews${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<any[]>(url);
  }

  static async getBnbAnalytics() {
    return this.request<any>('bnb/analytics');
  }

  static async getAdminBnbAnalytics(dateRange?: string) {
    const queryParams = dateRange ? `?date_range=${dateRange}` : '';
    return this.request<any>(`admin/bnb/analytics${queryParams}`);
  }

  // ── Admin BNB Methods ─────────────────────────────────────────────────────

  static async getAdminBnbProperties(filters?: {
    search?: string; status?: string; location?: string;
    min_price?: number; max_price?: number; owner_id?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (filters?.search)    queryParams.append('search',    filters.search);
    if (filters?.status)    queryParams.append('status',    filters.status);
    if (filters?.location)  queryParams.append('location',  filters.location);
    if (filters?.min_price) queryParams.append('min_price', filters.min_price.toString());
    if (filters?.max_price) queryParams.append('max_price', filters.max_price.toString());
    if (filters?.owner_id)  queryParams.append('owner_id',  filters.owner_id.toString());

    const url = `admin/bnb/properties${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<any[]>(url);
  }

  static async updateAdminBnbPropertyStatus(propertyId: number, status: string, adminNotes?: string) {
    return this.request<any>(`admin/bnb/properties/${propertyId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_notes: adminNotes }),
    });
  }

  // ── Public BNB Methods ─────────────────────────────────────────────────────

  static async searchBnbProperties(filters?: {
    search?: string; location?: string; check_in?: string; check_out?: string; guests?: number;
    min_price?: number; max_price?: number; property_type?: string; amenities?: string[];
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.request<any[]>(`public/bnb/search${params ? `?${params}` : ''}`);
  }

  static async getBnbPropertyDetails(id: number) {
    return this.request<any>(`public/bnb/properties/${id}`);
  }

  static async getBnbPropertyAvailability(propertyId: number, params?: { month?: string; from?: string; to?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.set('month', params.month);
    if (params?.from) queryParams.set('from', params.from);
    if (params?.to) queryParams.set('to', params.to);
    const q = queryParams.toString();
    return this.request<any>(`public/bnb/properties/${propertyId}/availability${q ? `?${q}` : ''}`);
  }

  static async getBnbOwnerPropertyAvailability(propertyId: number, params?: { month?: string; from?: string; to?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.set('month', params.month);
    if (params?.from) queryParams.set('from', params.from);
    if (params?.to) queryParams.set('to', params.to);
    const q = queryParams.toString();
    return this.request<any>(`bnb/properties/${propertyId}/availability${q ? `?${q}` : ''}`);
  }

  static async createBnbBooking(data: Record<string, unknown>) {
    return this.request<any>('my/bnb/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async initiateBnbBookingPayment(bookingId: number, data: {
    payment_mode: 'mobile_money' | 'bank';
    phone_number?: string;
    provider?: string;
  }) {
    return this.request<any>(`my/bnb/bookings/${bookingId}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async checkBnbBookingPaymentStatus(orderId: string) {
    return this.request<any>(`my/bnb/bookings/payment/status/${encodeURIComponent(orderId)}`);
  }

  static async getMyBnbBookings(filters?: { status?: string; per_page?: number }) {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.per_page) params.set('per_page', String(filters.per_page));
    const q = params.toString();
    return this.request<any>(`my/bnb/bookings${q ? `?${q}` : ''}`);
  }

  static async getMyBnbReviews(perPage = 100) {
    return this.request<any[]>(`my/bnb/reviews?per_page=${perPage}`);
  }

  static async cancelMyBnbBooking(bookingId: number, reason?: string) {
    return this.request<any>(`my/bnb/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ cancellation_reason: reason || 'Cancelled by guest' }),
    });
  }

  static async submitMyBnbReview(data: {
    property_id: number;
    booking_id: number;
    rating: number;
    comment: string;
    private_feedback?: string;
  }) {
    return this.request<any>('my/bnb/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async submitBnbReview(propertyId: number, data: any) {
    return this.request<any>('my/bnb/reviews', {
      method: 'POST',
      body: JSON.stringify({ ...data, property_id: propertyId }),
    });
  }

  static async respondToBnbReview(reviewId: number, response: string) {
    return this.request<any>(`bnb/reviews/${reviewId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    });
  }

  // ── Properties (public) ─────────────────────────────────────────────────────

  static async getProperties(filters?: {
    search?: string; type?: string;
    minPrice?: number; maxPrice?: number; location?: string;
    bedrooms?: number; furnished?: boolean;
    page?: number;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.request<any>(`public/properties${params ? `?${params}` : ''}`);
  }

  static async getAllProperties(filters?: {
    search?: string; type?: string;
    minPrice?: number; maxPrice?: number; location?: string;
    bedrooms?: number; furnished?: boolean;
    page?: number;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.request<any>(`properties/all${params ? `?${params}` : ''}`);
  }

  static async getAgentListings(filters?: {
    search?: string; type?: string;
    minPrice?: number; maxPrice?: number; location?: string;
    bedrooms?: number; furnished?: boolean;
    page?: number;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.request<any>(`agent/listings/public${params ? `?${params}` : ''}`);
  }

  static async getProperty(id: number) {
    return this.request<Property>(`public/properties/${id}`);
  }

  static async getPropertyWithParams(id: number, params?: string) {
    const url = params ? `public/properties/${id}?${params}` : `public/properties/${id}`;
    return this.request<Property>(url);
  }

  // ── Tenant ──────────────────────────────────────────────────────────────────

  static async getTenantDashboard()      { return this.request<any>('tenant/dashboard'); }
  static async getSavedProperties()      { return this.request<Property[]>('tenant/saved-properties'); }
  static async getTenantApplications()   { return this.request<any[]>('tenant/applications'); }
  static async getDigitalContracts()      { return this.request<any[]>('owner/digital-contracts'); }
  static async generateDigitalContract(data: any) {
    return this.request<any>('owner/digital-contracts/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  static async updateContract(id: number, data: any) { return this.request<any>(`tenant/contract/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  static async signContract(id: number) { return this.request<any>(`tenant/contract/${id}/sign`, { method: 'POST' }); }

  static async getTenantDigitalContracts() { return this.request<any[]>('tenant/digital-contracts'); }
  static async downloadDigitalContract(id: number) { return this.request(`tenant/digital-contracts/${id}/download`); }
  static async submitDigitalContract(data: any) { return this.request<any>('tenant/digital-contracts/submit', { method: 'POST', body: JSON.stringify(data) }); }
  static async getMyPayments()           { return this.request<any>('tenant/payments'); }
  static async getPaymentMethods()       { return this.request<any>('tenant/payment-methods'); }
  static async getPaymentStats()         { return this.request<any>('tenant/payment-stats'); }
  static async getPaymentHistory()       { return this.request<any>('tenant/payment-history'); }
  static async getPaymentSummary()       { return this.request<any>('tenant/payment-summary'); }
  static async getTenantAnalytics()      { return this.request<any>('tenant/analytics'); }

  static async saveProperty(propertyId: number) {
    return this.request(`tenant/properties/${propertyId}/save`, { method: 'POST' });
  }

  static async unsaveProperty(propertyId: number) {
    return this.request(`tenant/properties/${propertyId}/save`, { method: 'DELETE' });
  }

  static async publicSaveProperty(_propertyId: number) {
    return Promise.resolve({ success: true });
  }

  static async publicUnsaveProperty(_propertyId: number) {
    return Promise.resolve({ success: true });
  }

  // ── Site Visits ─────────────────────────────────────────────────────────────

  static async requestSiteVisit(data: any) {
    return this.request<any>('site-visits', { method: 'POST', body: JSON.stringify(data) });
  }

  static async getMyVisits() {
    return this.request<any>('site-visits');
  }

  static async confirmVisit(visitId: number) {
    return this.request<any>(`site-visits/${visitId}/confirm`, { method: 'PATCH' });
  }

  static async cancelVisit(visitId: number, reason: string) {
    return this.request<any>(`site-visits/${visitId}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) });
  }

  static async getVisitNotifications() {
    return this.request<any>('site-visits/notifications');
  }

  static async markNotificationRead(notificationId: number) {
    return this.request<any>(`notifications/${notificationId}/read`, { method: 'PATCH' });
  }

  static async createApplication(applicationData: any) {
    return this.request<any>('tenant/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  static async initiateSiteVisitPayment(data: {
    propertyId: number;
    phoneNumber: string;
    provider: string;
  }) {
    return this.request<any>('tenant/site-visit/pay', {
      method: 'POST',
      body: JSON.stringify({
        property_id: data.propertyId,
        phone_number: data.phoneNumber,
        provider: data.provider,
      }),
    });
  }

  static async checkSiteVisitPaymentStatus(orderId: string) {
    return this.request<any>(`tenant/site-visit/status/${encodeURIComponent(orderId)}`);
  }

  static async initiateRentPayment(data: {
    applicationId: number;
    phoneNumber: string;
    provider: string;
  }) {
    return this.request<any>('tenant/rent/pay', {
      method: 'POST',
      body: JSON.stringify({
        application_id: data.applicationId,
        phone_number: data.phoneNumber,
        provider: data.provider,
      }),
    });
  }

  static async checkRentPaymentStatus(orderId: string) {
    return this.request<any>(`tenant/rent/status/${encodeURIComponent(orderId)}`);
  }

  static async checkMonthlyPaymentStatus(paymentId: number) {
    return this.request<any>(`tenant/payments/${paymentId}/status`);
  }

  static async notifyAgent(notificationData: any) {
    return this.request<any>('notifications/agent', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  static async getAgentNotifications() {
    return this.request<any>('notifications/agent');
  }

  static async processPayment(paymentData: any) {
    return this.request<any>('payments/process', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  static async makePayment(
    paymentId: number,
    data: { phoneNumber: string; provider: string },
  ) {
    return this.request(`tenant/payments/${paymentId}/pay`, {
      method: 'POST',
      body: JSON.stringify({
        phone_number: data.phoneNumber,
        provider: data.provider,
      }),
    });
  }

  static async getRentableProperties() {
    return this.request<any>('tenant/rent/properties');
  }

  static async createAdditionalMonthsPayment(propertyId: number, months: number) {
    return this.request<any>('tenant/rent/additional-months', {
      method: 'POST',
      body: JSON.stringify({ property_id: propertyId, months }),
    });
  }

  static async getAgentRentPayments() {
    return this.request<any>('agent/rent-payments');
  }

  static async getAgentRentPaymentStats() {
    return this.request<any>('agent/rent-payment-stats');
  }

  static async downloadReceipt(paymentId: number) {
    return this.request(`tenant/payments/${paymentId}/receipt`, {
      headers: { 'Accept': 'application/pdf' },
    });
  }

  static async updateApplicationPaymentStatus(applicationId: number, paymentData: any) {
    return this.request<any>(`tenant/applications/${applicationId}/payment-status`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  }

  static async createContract(contractData: any) {
    return this.request<any>('tenant/contracts', {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
  }

  static async downloadContract(id: number) {
    return this.request(`tenant/contracts/${id}/download`, {
      headers: { 'Accept': 'application/pdf' },
    });
  }

  // ── Notifications (tenant-scoped) ───────────────────────────────────────────

  static async getNotifications()           { return this.request<any>('tenant/notifications'); }
  static async getNotificationStats()       { return this.request<any>('tenant/notification-stats'); }
  static async markAllNotificationsAsRead() { return this.request('tenant/notifications/read-all', { method: 'PATCH' }); }
  static async getTenantMessages()          { return this.request<any>('tenant/messages'); }
  static async sendTenantMessage(data: { subject?: string; body: string }) {
    return this.request<any>('tenant/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async markNotificationAsRead(id: number) {
    return this.request(`tenant/notifications/${id}/read`, { method: 'PATCH' });
  }

  static async archiveNotification(id: number) {
    return this.request(`tenant/notifications/${id}/archive`, { method: 'PATCH' });
  }

  static async deleteNotification(id: number) {
    return this.request(`tenant/notifications/${id}`, { method: 'DELETE' });
  }

  // ── Agent ───────────────────────────────────────────────────────────────────

  static async getAgentDashboard()        { return this.request<any>('agent/dashboard'); }
  static async getMyListings()            { return this.request<any[]>('agent/my-listings'); }
  static async getLinkedOwners()          { return this.request<any[]>('agent/linked-owners'); }
  static async getTrackingLinks()         { return this.request<any[]>('agent/tracking'); }
  static async recordShare(propertyId: number) { return this.request<any>(`agent/listings/${propertyId}/share`, { method: 'POST' }); }
  static async debugProperty(id: number) { return this.request<any>(`agent/debug-property/${id}`); }
  static async getLeads()                 { return this.request<any[]>('agent/leads'); }
  static async getLeadStats()             { return this.request<any>('agent/lead-stats'); }
  static async getAgentApplications()     { return this.request<any[]>('agent/applications'); }
  static async approveAgentApplication(id: number) { return this.request(`agent/applications/${id}/approve`, { method: 'PATCH' }); }
  static async rejectAgentApplication(id: number, reason: string) {
    return this.request(`agent/applications/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }
  static async getMyCommissions()         { return this.request<any[]>('agent/my-commissions'); }
  static async getAgentCommissionStats()  { return this.request<any>('agent/commission-stats'); }
  static async getPayoutHistory()         { return this.request<any[]>('agent/payouts'); }
  static async getAgentAnalytics()        { return this.request<any>('agent/analytics'); }
  static async getAgentMessages()         { return this.request<any>('agent/messages'); }
  static async sendAgentMessage(data: { receiver_id: number; property_id?: number; subject?: string; body: string }) {
    return this.request<any>('agent/messages', { method: 'POST', body: JSON.stringify(data) });
  }

  static async createListing(data: any) {
    return this.request<any>('agent/listings', { method: 'POST', body: JSON.stringify(data) });
  }

  static async updateListing(id: number, data: any) {
    return this.request(`agent/listings/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  static async deleteListing(id: number) {
    return this.request(`agent/listings/${id}`, { method: 'DELETE' });
  }

  static async getPropertyAnalytics(id: number) {
    return this.request(`agent/listings/${id}/analytics`);
  }

  static async linkOwner(ownerData: any) {
    return this.request<any>('agent/link-owner', { method: 'POST', body: JSON.stringify(ownerData) });
  }

  static async generateQRCode(propertyId: number) {
    return this.request(`agent/qr-codes/${propertyId}`);
  }

  // ── Owner / Landlord ────────────────────────────────────────────────────────

  static async getOwnerDashboard()        { return this.request<any>('owner/dashboard'); }
  static async getOwnerProperties()       { return this.request<any[]>('owner/my-properties'); }
  static async getOwnerApplications()     { return this.request<any[]>('owner/applications'); }
  static async getMyTenants()             { return this.request<any[]>('owner/tenants'); }
  static async createTenantFromApprovedApplication() { return this.request<any>('owner/tenants/create-from-approved', { method: 'POST' }); }

  static async updateApplicationStatus(id: number, status: string, message?: string) {
    return this.request<any>(`owner/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, message }),
    });
  }

  static async notifyTenantApproval(applicationId: number, tenantEmail: string) {
    return this.request<any>('tenant/applications/notify-approval', {
      method: 'POST',
      body: JSON.stringify({ applicationId, tenantEmail }),
    });
  }

  static async getOwnerContracts()        { return this.request<any[]>('owner/contracts'); }
  static async getRentCollection()        { return this.request<any[]>('owner/rent-collection'); }
  static async getRentCollectionStats()   { return this.request<any>('owner/rent-collection-stats'); }
  static async getReceipts()              { return this.request<any[]>('owner/receipts'); }
  static async getCommissionReports()     { return this.request<any[]>('owner/commission-reports'); }
  static async getOwnerAnalytics()        { return this.request<any>('owner/analytics'); }
  static async getOwnerMessages()         { return this.request<any[]>('owner/messages'); }

  static async createOwnerProperty(data: any) {
    if (data instanceof FormData) {
      return this.request<any>('owner/properties', { method: 'POST', body: data, headers: {} });
    }
    return this.request<any>('owner/properties', { method: 'POST', body: JSON.stringify(data) });
  }

  static async agentCreateProperty(data: any) {
    if (data instanceof FormData) {
      return this.request<any>('agent/listings', { method: 'POST', body: data, headers: {} });
    }
    return this.request<any>('agent/listings', { method: 'POST', body: JSON.stringify(data) });
  }

  static async createProperty(data: any) {
    if (data instanceof FormData) {
      return this.request<any>('properties', { method: 'POST', body: data, headers: {} });
    }
    return this.request<any>('properties', { method: 'POST', body: JSON.stringify(data) });
  }

  static async getOwnerProperty(id: number) {
    return this.request<any>(`owner/properties/${id}`);
  }

  static async updateOwnerProperty(id: number, data: any) {
    return this.request(`owner/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  static async deleteOwnerProperty(id: number) {
    return this.request(`owner/properties/${id}`, { method: 'DELETE' });
  }

  static async getOwnerPropertyAnalytics(id: number) {
    return this.request(`owner/properties/${id}/analytics`);
  }

  static async approveApplication(id: number) {
    return this.request(`owner/applications/${id}/approve`, { method: 'PATCH' });
  }

  static async rejectApplication(id: number, reason: string) {
    return this.request(`owner/applications/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejection_reason: reason }),
    });
  }

  static async createOwnerContract(data: any) {
    return this.request<any>('owner/contracts', { method: 'POST', body: JSON.stringify(data) });
  }

  static async updateOwnerContract(id: number, data: any) {
    return this.request<any>(`owner/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  static async signOwnerContract(id: number) {
    return this.request<any>(`owner/contracts/${id}/sign`, { method: 'POST' });
  }

  static async createRentSchedule(contractId: number, data: any) {
    return this.request<any>(`owner/contracts/${contractId}/rent-schedule`, { method: 'POST', body: JSON.stringify(data) });
  }

  static async downloadOwnerReceipt(paymentId: number) {
    return this.request(`owner/receipts/${paymentId}/download`, {
      headers: { 'Accept': 'application/pdf' },
    });
  }

  static async createDigitalContract(data: any) { return this.request<any>('owner/digital-contracts', { method: 'POST', body: JSON.stringify(data) }); }
  static async uploadContractFile(formData: FormData) { return this.request<any>('owner/digital-contracts/upload-file', { method: 'POST', body: formData, headers: {} }); }
  static async sendContractToTenant(contractId: number) { return this.request<any>(`owner/digital-contracts/${contractId}/send`, { method: 'PUT' }); }
  static async approveSignedContract(contractId: number) { return this.request<any>(`owner/digital-contracts/${contractId}/approve`, { method: 'PUT' }); }
  static async downloadLandlordDigitalContract(id: number) { return this.request(`owner/digital-contracts/${id}/download`); }

  static async sendOwnerMessage(data: {
    receiver_id: number;
    property_id?: number;
    subject?: string;
    body: string;
  }) {
    return this.request<any>('owner/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ── Dashboard (generic) ─────────────────────────────────────────────────────

  static async getDashboardData() {
    return this.request<DashboardStats>('dashboard');
  }

  static async getAnalytics() {
    return this.request<any>('analytics');
  }

  // ── Commercial ──────────────────────────────────────────────────────────────

  static async getCommercialDashboard() {
    return this.request<any>('commercial/dashboard');
  }

  
}

export default Api;