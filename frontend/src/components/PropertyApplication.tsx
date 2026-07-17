import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface PropertyApplicationProps {
  propertyId: number;
  propertyTitle: string;
  rentAmount: number;
  onApplicationSubmit: (data: ApplicationData) => Promise<void>;
  isLoading?: boolean;
  onSuccess?: () => void;
  existingApplication?: any;
}

interface ApplicationData {
  property_id: number;
  message?: string;
  offered_rent?: number;
}

export const PropertyApplication: React.FC<PropertyApplicationProps> = ({
  propertyId,
  propertyTitle,
  rentAmount,
  onApplicationSubmit,
  isLoading = false,
  onSuccess,
  existingApplication
}) => {
  const [formData, setFormData] = useState({
    message: existingApplication?.message || '',
    offered_rent: existingApplication?.offered_rent || rentAmount,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'offered_rent' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (formData.offered_rent <= 0) {
        throw new Error('Offered rent must be greater than 0');
      }

      await onApplicationSubmit({
        property_id: propertyId,
        message: formData.message || undefined,
        offered_rent: formData.offered_rent,
      });

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (existingApplication && !['withdrawn', 'rejected'].includes(existingApplication.status)) {
    return (
      <div className="border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-blue-200">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Application Already Submitted
          </h2>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Your application for <strong>{propertyTitle}</strong> has been submitted.
          </p>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg space-y-2 text-sm">
            <div><strong>Status:</strong> <span className="capitalize">{existingApplication.status}</span></div>
            <div><strong>Offered Rent:</strong> Tsh {existingApplication.offered_rent?.toLocaleString() || rentAmount.toLocaleString()}</div>
            {existingApplication.message && (
              <div><strong>Your Message:</strong> {existingApplication.message}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Apply for Property</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Submit your application for {propertyTitle}
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

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Application submitted successfully! You'll be notified when the owner reviews it.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Property Rent Amount
            </label>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-semibold text-gray-900 dark:text-white">
              Tsh {rentAmount.toLocaleString()} / month
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="offered_rent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Offered Rent (or counter-offer)
            </label>
            <input
              id="offered_rent"
              name="offered_rent"
              type="number"
              min="0"
              step="1000"
              value={formData.offered_rent}
              onChange={handleInputChange}
              placeholder="Enter amount in TZS"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              You can offer the same amount or negotiate
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Message to Owner (Optional)
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Tell the owner/dalali about yourself, why you'd be a good tenant, etc."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> After the owner approves your application, you'll need to pay rent for the property's payment period (e.g. 3, 6, or 12 months) plus any service charge to activate your lease.
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PropertyApplication;
