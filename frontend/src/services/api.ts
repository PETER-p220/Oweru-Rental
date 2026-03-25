// API service for connecting to Laravel backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── The single source of truth for the token key ──────────────────────────────
// Make sure localStorage.setItem uses this same key when you save the token
// after login/register.
export const TOKEN_KEY = 'token';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface DashboardStats {
  totalProperties: number;
  savedProperties: number;
  totalApplications: number;
  messages: number;
  // Landlord-specific
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
  userType: 'tenant' | 'landlord' | 'agent' | 'admin';
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  owner: { id: number; firstName: string; lastName: string };
  agent?: { id: number; firstName: string; lastName: string; commission: number };
  featured: boolean;
  available: boolean;
  createdAt: string;
  updatedAt: string;
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
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}/api/${endpoint}`;

    // Don't set Content-Type for FormData - let browser set it with boundary
    const isFormData = options.body instanceof FormData;
    
    const defaultHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    if (!isFormData) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    // ── FIX: use TOKEN_KEY consistently everywhere ──────────────────────────
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    // ── Return structured error so callers can read response.data.errors ────
    if (!response.ok) {
      let errorBody: any = {};
      try { errorBody = await response.json(); } catch { /* ignore */ }
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

  static async login(email: string, password: string, userType: string) {
    return this.request<LoginResponse>('login', {
      method: 'POST',
      body: JSON.stringify({ email, password, user_type: userType }),
    });
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

  static async getAdminPropertyStats() {
    return this.request<any>('admin/properties/stats');
  }

  // ── Admin – Transactions ────────────────────────────────────────────────────

  static async getAdminTransactions(filters?: {
    search?: string; type?: string; status?: string;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.request<any[]>(`admin/transactions${params ? `?${params}` : ''}`);
  }

  static async getAdminTransactionStats() {
    return this.request<any>('admin/transactions/stats');
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
  static async getCommissionPayments() { return this.request<any[]>('admin/commission/payments'); }
  static async getCommissionStats()    { return this.request<any>('admin/commission/stats'); }
  static async updateCommissionPaymentStatus(id: number, status: string) {
    return this.request<any>(`admin/commission/payments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
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

  static async getProperty(id: number) {
    return this.request<Property>(`public/properties/${id}`);
  }

  // ── Tenant ──────────────────────────────────────────────────────────────────

  static async getTenantDashboard()      { return this.request<any>('tenant/dashboard'); }
  static async getSavedProperties()      { return this.request<Property[]>('tenant/saved-properties'); }
  static async getTenantApplications()   { return this.request<any[]>('tenant/applications'); }
  static async getMyContract()           { return this.request<any>('tenant/contract'); }
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

  // ── Public Save/Unsave (works without auth for demo) ──────────────────────────────
  static async publicSaveProperty(propertyId: number) {
    // For demo purposes, just return success
    return Promise.resolve({ success: true });
  }

  static async publicUnsaveProperty(propertyId: number) {
    // For demo purposes, just return success  
    return Promise.resolve({ success: true });
  }

  static async createApplication(applicationData: any) {
    return this.request<any>('tenant/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  static async makePayment(paymentId: number, data: { paymentMethodId: string }) {
    return this.request(`tenant/payments/${paymentId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ payment_method_id: data.paymentMethodId }),
    });
  }

  static async downloadReceipt(paymentId: number) {
    return this.request(`tenant/payments/${paymentId}/receipt`, {
      headers: { 'Accept': 'application/pdf' },
    });
  }

  static async downloadContract(id: number) {
    return this.request(`tenant/contracts/${id}/download`, {
      headers: { 'Accept': 'application/pdf' },
    });
  }

  // ── Notifications (tenant-scoped) ───────────────────────────────────────────

  static async getNotifications()          { return this.request<any>('tenant/notifications'); }
  static async getNotificationStats()      { return this.request<any>('tenant/notification-stats'); }
  static async markAllNotificationsAsRead(){ return this.request('tenant/notifications/read-all', { method: 'PATCH' }); }
  static async getTenantMessages()         { return this.request<any>('tenant/messages'); }
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
  static async getLeads()                 { return this.request<any[]>('agent/leads'); }
  static async getLeadStats()             { return this.request<any>('agent/lead-stats'); }
  static async getAgentApplications()     { return this.request<any[]>('agent/applications'); }
  static async getMyCommissions()         { return this.request<any[]>('agent/my-commissions'); }
  static async getAgentCommissionStats()  { return this.request<any>('agent/commission-stats'); }
  static async getPayoutHistory()         { return this.request<any[]>('agent/payouts'); }
  static async getAgentAnalytics()        { return this.request<any>('agent/analytics'); }
  static async getAgentMessages()         { return this.request<any>('agent/messages'); }
  static async sendAgentMessage(data: { recipient_id: number; property_id?: number; subject?: string; body: string }) {
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
  static async getOwnerContracts()        { return this.request<any[]>('owner/contracts'); }
  static async getRentCollection()        { return this.request<any[]>('owner/rent-collection'); }
  static async getRentCollectionStats()   { return this.request<any>('owner/rent-collection-stats'); }
  static async getReceipts()              { return this.request<any[]>('owner/receipts'); }
  static async getCommissionReports()     { return this.request<any[]>('owner/commission-reports'); }
  static async getOwnerAnalytics()        { return this.request<any>('owner/analytics'); }
  static async getOwnerMessages()         { return this.request<any[]>('owner/messages'); }

  static async createOwnerProperty(data: any) {
    // Handle FormData for file uploads
    if (data instanceof FormData) {
      return this.request<any>('owner/properties', { 
        method: 'POST', 
        body: data,
        headers: {} // Let browser set Content-Type for FormData
      });
    }
    return this.request<any>('owner/properties', { 
      method: 'POST', 
      body: JSON.stringify(data)
    });
  }

  static async agentCreateProperty(data: any) {
    // Handle FormData for file uploads
    if (data instanceof FormData) {
      return this.request<any>('agent/properties', { 
        method: 'POST', 
        body: data,
        headers: {} // Let browser set Content-Type for FormData
      });
    }
    return this.request<any>('agent/properties', { 
      method: 'POST', 
      body: JSON.stringify(data)
    });
  }

  static async createProperty(data: any) {
    // Handle FormData for file uploads
    if (data instanceof FormData) {
      return this.request<any>('properties', { 
        method: 'POST', 
        body: data,
        headers: {} // Let browser set Content-Type for FormData
      });
    }
    return this.request<any>('properties', { 
      method: 'POST', 
      body: JSON.stringify(data)
    });
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

  static async downloadOwnerReceipt(paymentId: number) {
    return this.request(`owner/receipts/${paymentId}/download`, {
      headers: { 'Accept': 'application/pdf' },
    });
  }

  static async sendOwnerMessage(data: {
    recipient_id: number;
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
}

export default Api;
