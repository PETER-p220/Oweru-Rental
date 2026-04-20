import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { AlertCircle, Loader2, CheckCircle, DollarSign, Phone } from 'lucide-react';
import SelcomService from '../services/selcom';

interface PaymentInstructionsProps {
  applicationId: number;
  propertyTitle: string;
  rentAmount: number;
  serviceCharge?: number;
  onPaymentInitiate: (data: PaymentInitiationData) => Promise<void>;
  isLoading?: boolean;
  onSuccess?: () => void;
}

interface PaymentInitiationData {
  application_id: number;
  phone_number: string;
  payment_method?: string;
  service_charge?: number;
  payment_provider?: 'tigo' | 'mpesa' | 'airtel';
}

export const PaymentInitiation: React.FC<PaymentInstructionsProps> = ({
  applicationId,
  propertyTitle,
  rentAmount,
  serviceCharge = 0,
  onPaymentInitiate,
  isLoading = false,
  onSuccess,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentProvider, setPaymentProvider] = useState<'tigo' | 'mpesa' | 'airtel'>('tigo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const totalAmount = rentAmount + serviceCharge;

  const validatePhoneNumber = (phone: string): boolean => {
    // Accept Tanzania phone numbers in various formats
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 12 || cleaned.length === 10 || cleaned.length === 9;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid Tanzania phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use Selcom service for payment processing
      const paymentResponse = await SelcomService.initiateMobileMoneyPayment({
        amount: totalAmount,
        phone_number: phoneNumber,
        provider: paymentProvider,
        property_id: applicationId,
        tenant_id: 1, // This should come from user context
        payment_type: 'rent_payment',
        customer_email: '', // Optional
        customer_name: '', // Optional
      });

      if (paymentResponse.success && paymentResponse.data?.transaction_id) {
        // Call the original callback with transaction data
        await onPaymentInitiate({
          application_id: applicationId,
          phone_number: phoneNumber,
          payment_method: 'selcom',
          service_charge: serviceCharge,
          payment_provider: paymentProvider,
        });

        setSuccess(true);
        onSuccess?.();
      } else {
        throw new Error(paymentResponse.message || 'Payment initiation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="border border-green-200 bg-green-50 dark:bg-green-900/20 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-green-200">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Payment Initiated Successfully
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2 text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              Payment prompt will be sent to your phone shortly. Please:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
              <li>Wait for the USSD/SMS prompt on your phone</li>
              <li>Enter your PIN to complete the payment</li>
              <li>Once confirmed, your contract will be automatically activated</li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-300">
            <strong>Amount to Pay:</strong> Tsh {totalAmount.toLocaleString()}
          </div>

          <button
            onClick={onSuccess}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Complete Payment</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Pay first month's rent and service charge for {propertyTitle}
        </p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Payment Breakdown */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-sm">Payment Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">First Month Rent:</span>
                <span className="font-semibold">Tsh {rentAmount.toLocaleString()}</span>
              </div>
              {serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Service Charge:</span>
                  <span className="font-semibold">Tsh {serviceCharge.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold">
                <span>Total Amount Due:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  Tsh {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Provider Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'tigo' as const, label: 'Tigo Pesa', color: 'blue' },
                { value: 'mpesa' as const, label: 'M-Pesa', color: 'green' },
                { value: 'airtel' as const, label: 'Airtel Money', color: 'red' },
              ].map((provider) => (
                <button
                  key={provider.value}
                  type="button"
                  onClick={() => setPaymentProvider(provider.value)}
                  disabled={isSubmitting}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                    paymentProvider === provider.value
                      ? `border-${provider.color}-500 bg-${provider.color}-50 text-${provider.color}-700 dark:bg-${provider.color}-900/20 dark:text-${provider.color}-400`
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {provider.label}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
              placeholder="e.g., +255 123 456 789 or 0123 456 789"
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter your {paymentProvider.toUpperCase()} registered number
            </p>
          </div>

          {/* Payment Methods Info */}
          <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold">Accepted Payment Methods:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Tigo Pesa</li>
              <li>M-Pesa Tanzania</li>
              <li>Airtel Money</li>
              <li>Halopesa</li>
            </ul>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400">
            <strong>🔒 Secure:</strong> Your payment is processed securely through Oweru's integrated payment gateway. We never store your PIN or sensitive payment information.
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading || !phoneNumber}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Initiating {paymentProvider.toUpperCase()} Payment...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                Pay Tsh {totalAmount.toLocaleString()} via {paymentProvider === 'tigo' ? 'Tigo Pesa' : paymentProvider === 'mpesa' ? 'M-Pesa' : 'Airtel Money'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentInitiation;
