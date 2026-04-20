import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, CheckCircle, Calendar, DollarSign, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistance } from 'date-fns';

interface PaymentReminder {
  id: number;
  amount: number;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue';
  property_title: string;
  type: 'monthly_rent' | 'service_charge';
  payment_month?: string;
}

interface MonthlyPaymentReminderProps {
  payments: PaymentReminder[];
  isLoading?: boolean;
  onPaymentSubmit: (paymentId: number, phoneNumber: string) => Promise<void>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-green-600 dark:text-green-400';
    case 'overdue':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-orange-600 dark:text-orange-400';
  }
};

const getStatusBg = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200';
    case 'overdue':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200';
    default:
      return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200';
  }
};

const PaymentCard: React.FC<{
  payment: PaymentReminder;
  onPaymentSubmit: (paymentId: number, phoneNumber: string) => Promise<void>;
}> = ({ payment, onPaymentSubmit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dueDate = new Date(payment.due_date);
  const today = new Date();
  const isOverdue = dueDate < today && payment.status === 'pending';

  const handlePaymentSubmit = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onPaymentSubmit(payment.id, phoneNumber);
      setSuccess(true);
      setTimeout(() => {
        setIsExpanded(false);
        setSuccess(false);
        setPhoneNumber('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className={`border-2 transition-all ${getStatusBg(isOverdue ? 'overdue' : payment.status)}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{payment.property_title}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                payment.status === 'completed'
                  ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                  : isOverdue
                  ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                  : 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200'
              }`}>
                {isOverdue ? 'Overdue' : payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Due: {dueDate.toLocaleDateString()} ({formatDistance(dueDate, today, { addSuffix: true })})</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>Amount: Tsh {payment.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="text-2xl">
            {payment.status === 'completed' 
              ? <CheckCircle className="w-6 h-6 text-green-500" />
              : isOverdue 
              ? <AlertCircle className="w-6 h-6 text-red-500" />
              : <Calendar className="w-6 h-6 text-orange-500" />
            }
          </div>
        </div>
      </button>

      {/* Expanded Payment Form */}
      {isExpanded && payment.status === 'pending' && (
        <CardContent className="pt-0 border-t mt-4 space-y-3">
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
                Payment initiated! Check your phone for payment prompt.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium">Phone Number</label>
            <Input
              type="tel"
              placeholder="Enter your mobile money number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Mobile money registered number (Tigo, M-Pesa, Airtel, Halopesa)
            </p>
          </div>

          <Button
            onClick={handlePaymentSubmit}
            disabled={isProcessing || !phoneNumber.trim()}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Phone className="w-4 h-4 mr-2" />
                Pay Now - Tsh {payment.amount.toLocaleString()}
              </>
            )}
          </Button>
        </CardContent>
      )}

      {payment.status === 'completed' && (
        <CardContent className="pt-0 border-t mt-4">
          <p className="text-sm text-green-700 dark:text-green-300">
            ✓ Payment completed successfully
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export const MonthlyPaymentReminder: React.FC<MonthlyPaymentReminderProps> = ({
  payments,
  isLoading = false,
  onPaymentSubmit,
}) => {
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const completedPayments = payments.filter(p => p.status === 'completed');
  const overduePayments = pendingPayments.filter(p => new Date(p.due_date) < new Date());

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

  if (payments.length === 0) {
    return (
      <Card className="border-2 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>No Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have any pending or completed payments yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Payment Reminders</h2>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {overduePayments.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-red-600 dark:text-red-400 font-semibold text-lg">
                    {overduePayments.length}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">Overdue Payment(s)</p>
                </div>
              </CardContent>
            </Card>
          )}

          {pendingPayments.filter(p => new Date(p.due_date) >= new Date()).length > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-orange-600 dark:text-orange-400 font-semibold text-lg">
                    {pendingPayments.filter(p => new Date(p.due_date) >= new Date()).length}
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">Upcoming Payment(s)</p>
                </div>
              </CardContent>
            </Card>
          )}

          {completedPayments.length > 0 && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-green-600 dark:text-green-400 font-semibold text-lg">
                    {completedPayments.length}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">Completed Payment(s)</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment Cards */}
        <div className="space-y-3">
          {payments.map(payment => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onPaymentSubmit={onPaymentSubmit}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonthlyPaymentReminder;
