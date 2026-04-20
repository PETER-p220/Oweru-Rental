import React, { useState } from 'react';
import { AlertCircle, Loader2, CheckCircle, XCircle, MessageSquare, User, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ApplicationItem {
  id: number;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  offered_rent: number;
  message?: string;
  applied_at: string;
  landlord_notes?: string;
}

interface ApplicationManagementProps {
  applications: ApplicationItem[];
  propertyTitle: string;
  isLoading?: boolean;
  onApprove: (applicationId: number) => Promise<void>;
  onReject: (applicationId: number, reason: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

const ApplicationCardOwner: React.FC<{
  application: ApplicationItem;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
}> = ({ application, onApprove, onReject }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);

    try {
      await onApprove(application.id);
      setSuccess(true);
      setTimeout(() => {
        setIsExpanded(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve application');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsRejecting(true);
    setError(null);

    try {
      await onReject(application.id, rejectionReason);
      setSuccess(true);
      setTimeout(() => {
        setIsExpanded(false);
        setSuccess(false);
        setRejectionReason('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject application');
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusColor = () => {
    switch (application.status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
    }
  };

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <h3 className="font-semibold">{application.user.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{application.user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Offered: Tsh {application.offered_rent.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Applied: {new Date(application.applied_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor()}`}>
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </span>
        </div>
      </button>

      {isExpanded && (
        <CardContent className="pt-0 border-t space-y-4">
          {/* Tenant Message */}
          {application.message && (
            <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Tenant's Message:</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{application.message}</p>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg flex gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">
                {isApproving ? 'Application approved!' : 'Application rejected'}
              </p>
            </div>
          )}

          {/* Tenant Contact Info */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Email</p>
              <p className="font-mono text-xs break-all">{application.user.email}</p>
            </div>
            {application.user.phone && (
              <div>
                <p className="text-gray-600 dark:text-gray-400">Phone</p>
                <p className="font-mono text-xs">{application.user.phone}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {application.status === 'pending' && (
            <div className="space-y-3">
              <Button
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Application
                  </>
                )}
              </Button>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Rejection Reason (if rejecting)</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why you're rejecting this application..."
                  rows={2}
                  disabled={isRejecting}
                />
                <Button
                  onClick={handleReject}
                  disabled={isApproving || isRejecting}
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Application
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {application.status === 'approved' && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ This application has been approved. Tenant will now proceed with payment.
              </p>
            </div>
          )}

          {application.status === 'rejected' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                This application has been rejected.
              </p>
              {application.landlord_notes && (
                <p className="text-xs mt-2">Reason: {application.landlord_notes}</p>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export const ApplicationManagement: React.FC<ApplicationManagementProps> = ({
  applications,
  propertyTitle,
  isLoading = false,
  onApprove,
  onReject,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  };

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">Applications for {propertyTitle}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage rental applications from interested tenants
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            {refreshing ? <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            </> : null}
            Refresh
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {pendingCount}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">Pending Review</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {approvedCount}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">Approved</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {rejectedCount}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600 dark:text-gray-400">
                No applications yet. Share your property to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map(application => (
              <ApplicationCardOwner
                key={application.id}
                application={application}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationManagement;
