export type ComplianceCategory =
  | 'maintenance'
  | 'compliance'
  | 'safety'
  | 'utilities'
  | 'noise'
  | 'other';

export type CompliancePriority = 'low' | 'medium' | 'high' | 'urgent';

export type ComplianceStatus =
  | 'submitted'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export interface ComplianceRequestItem {
  id: number;
  reference: string;
  category: ComplianceCategory;
  priority: CompliancePriority;
  status: ComplianceStatus;
  title: string;
  description: string;
  location_in_property?: string;
  preferred_date?: string;
  owner_response?: string;
  resolution_notes?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at?: string;
  updated_at?: string;
  property?: { id: number; title: string; location?: string; address?: string };
  tenant?: { id: number; name: string; email?: string; phone?: string };
  owner?: { name: string };
}

export interface ComplianceStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
}

export const CATEGORY_OPTIONS: { value: ComplianceCategory; label: string; hint: string }[] = [
  { value: 'maintenance', label: 'Maintenance & repairs', hint: 'Plumbing, electrical, structural, appliances' },
  { value: 'compliance', label: 'Lease compliance', hint: 'Agreement terms, documentation, inspections' },
  { value: 'safety', label: 'Safety issue', hint: 'Locks, fire safety, hazards' },
  { value: 'utilities', label: 'Utilities', hint: 'Water, electricity, internet, waste' },
  { value: 'noise', label: 'Noise / neighbourhood', hint: 'Disturbances affecting your tenancy' },
  { value: 'other', label: 'Other issue', hint: 'Anything else your landlord should know' },
];

export const PRIORITY_OPTIONS: { value: CompliancePriority; label: string }[] = [
  { value: 'low', label: 'Low — can wait' },
  { value: 'medium', label: 'Medium — normal' },
  { value: 'high', label: 'High — needs attention soon' },
  { value: 'urgent', label: 'Urgent — safety or habitability' },
];

export const STATUS_LABELS: Record<ComplianceStatus, string> = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function statusTone(status: ComplianceStatus): { bg: string; color: string; border: string } {
  switch (status) {
    case 'submitted':
      return { bg: '#DBEAFE', color: '#1D4ED8', border: 'rgba(37,99,235,0.25)' };
    case 'acknowledged':
      return { bg: '#E0E7FF', color: '#4338CA', border: 'rgba(67,56,202,0.25)' };
    case 'in_progress':
      return { bg: '#FEF3C7', color: '#B45309', border: 'rgba(245,158,11,0.28)' };
    case 'resolved':
      return { bg: '#DCFCE7', color: '#15803D', border: 'rgba(22,163,74,0.28)' };
    case 'closed':
      return { bg: '#F1F5F9', color: '#475569', border: 'rgba(71,85,105,0.2)' };
    default:
      return { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
  }
}

export function priorityTone(priority: CompliancePriority): { bg: string; color: string } {
  switch (priority) {
    case 'urgent':
      return { bg: '#FFE4E6', color: '#BE123C' };
    case 'high':
      return { bg: '#FFEDD5', color: '#C2410C' };
    case 'medium':
      return { bg: '#FEF9C3', color: '#A16207' };
    default:
      return { bg: '#F1F5F9', color: '#64748B' };
  }
}

export function formatComplianceDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
