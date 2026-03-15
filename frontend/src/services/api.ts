// API service for connecting to Laravel backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface DashboardStats {
  totalProperties: number;
  savedProperties: number;
  totalApplications: number;  // Changed from 'applications' to 'totalApplications'
  messages: number;
  // Landlord-specific stats
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
  userType: 'tenant' | 'landlord' | 'agent';
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
  owner: {
    id: number;
    firstName: string;
    lastName: string;
  };
  agent?: {
    id: number;
    firstName: string;
    lastName: string;
    commission: number;
  };
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
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
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

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      data: data.data || data,
      message: data.message,
      status: response.status,
    };
  }

  // Auth endpoints
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
    return this.request('logout', {
      method: 'POST',
    });
  }

  static async getUser() {
    return this.request<User>('user');
  }

  // Property endpoints
  static async getProperties(filters?: {
    search?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
  }) {
    const params = new URLSearchParams(filters as any).toString();
    return this.request<Property[]>(`properties${params ? `?${params}` : ''}`);
  }

  static async getProperty(id: number) {
    return this.request<Property>(`properties/${id}`);
  }

  static async saveProperty(propertyId: number) {
    return this.request(`properties/${propertyId}/save`, {
      method: 'POST',
    });
  }

  static async unsaveProperty(propertyId: number) {
    return this.request(`properties/${propertyId}/save`, {
      method: 'DELETE',
    });
  }

  static async getApplications() {
    return this.request<any[]>('applications');
  }

  static async approveApplication(id: number) {
    return this.request(`applications/${id}/approve`, {
      method: 'PATCH',
    });
  }

  static async rejectApplication(id: number) {
    return this.request(`applications/${id}/reject`, {
      method: 'PATCH',
    });
  }

  static async getAnalytics() {
    return this.request<any>('analytics');
  }

  static async getSavedProperties() {
    return this.request<Property[]>('properties/saved');
  }

  // Dashboard endpoints
  static async getDashboardData() {
    return this.request<DashboardStats>('dashboard');
  }

  static async createProperty(propertyData: any) {
    return this.request<any>('properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  static async getMyProperties() {
    return this.request<any[]>('my-properties');
  }

  static async getMyListings() {
    return this.request<any[]>('my-listings');
  }

  static async getPropertyAnalytics(propertyId: number) {
    return this.request(`properties/${propertyId}/analytics`);
  }

  static async getCommissions() {
    return this.request('commissions');
  }

  static async getLeads() {
    return this.request('leads');
  }
}

export default Api;
