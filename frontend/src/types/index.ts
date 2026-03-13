export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: 'apartment' | 'house' | 'studio';
  furnished: boolean;
  images: string[];
  owner: Owner;
  dalali?: Dalali;
  status: 'available' | 'rented' | 'pending';
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  verified: boolean;
}

export interface Dalali {
  id: string;
  name: string;
  email: string;
  phone: string;
  code: string;
  verified: boolean;
  commission: number;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  employmentStatus: string;
  monthlyIncome: number;
  references: Reference[];
}

export interface Reference {
  name: string;
  phone: string;
  relationship: string;
}

export interface Application {
  id: string;
  property: Property;
  tenant: Tenant;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  message?: string;
}

export interface Rental {
  id: string;
  property: Property;
  tenant: Tenant;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  deposit: number;
  status: 'active' | 'expired' | 'terminated';
  payments: Payment[];
}

export interface Payment {
  id: string;
  rental: Rental;
  amount: number;
  type: 'rent' | 'deposit' | 'fee';
  status: 'pending' | 'completed' | 'failed';
  dueDate: Date;
  paidAt?: Date;
  method: string;
  transactionId?: string;
}

export interface TrackingLink {
  id: string;
  property: Property;
  dalali: Dalali;
  url: string;
  qrCode: string;
  clicks: number;
  leads: number;
  conversions: number;
}
