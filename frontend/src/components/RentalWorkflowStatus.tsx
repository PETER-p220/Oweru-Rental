import React from 'react';
import { AlertCircle, CheckCircle, Clock, DollarSign, FileText, Home } from 'lucide-react';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'upcoming';
  content?: React.ReactNode;
}

interface RentalWorkflowStatusProps {
  applicationId?: number;
  propertyId: number;
  currentStatus: string;
  onStepClick?: (stepId: number) => void;
  paymentDetails?: {
    rentAmount: number;
    serviceCharge: number;
    totalAmount: number;
  };
}

export const RentalWorkflowStatus: React.FC<RentalWorkflowStatusProps> = ({
  currentStatus,
  onStepClick,
  paymentDetails
}) => {
  const steps: WorkflowStep[] = [
    {
      id: 1,
      title: 'Apply for Property',
      description: 'Submit your rental application',
      icon: <Home className="w-5 h-5" />,
      status: ['applied', 'approved', 'payment_pending', 'payment_completed', 'contract_active'].includes(currentStatus) 
        ? 'completed' 
        : 'current'
    },
    {
      id: 2,
      title: 'Await Approval',
      description: 'Wait for owner/dalali to review',
      icon: <Clock className="w-5 h-5" />,
      status: currentStatus === 'applied' ? 'current' : 
              ['approved', 'payment_pending', 'payment_completed', 'contract_active'].includes(currentStatus) 
              ? 'completed' 
              : 'upcoming'
    },
    {
      id: 3,
      title: 'Make Payment',
      description: 'Pay first month rent + service charge',
      icon: <DollarSign className="w-5 h-5" />,
      status: currentStatus === 'approved' ? 'current' :
              ['payment_pending', 'payment_completed', 'contract_active'].includes(currentStatus)
              ? 'completed'
              : 'upcoming'
    },
    {
      id: 4,
      title: 'Activate Contract',
      description: 'Digital contract generated and activated',
      icon: <FileText className="w-5 h-5" />,
      status: currentStatus === 'contract_active' ? 'completed' : 'upcoming'
    },
    {
      id: 5,
      title: 'Monthly Payments',
      description: 'Receive reminders and pay monthly rent',
      icon: <AlertCircle className="w-5 h-5" />,
      status: currentStatus === 'contract_active' ? 'current' : 'upcoming'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rental Workflow Progress</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your rental application and payment status
          </p>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id}>
            <button
              onClick={() => onStepClick?.(step.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                step.status === 'completed'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : step.status === 'current'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : step.status === 'current' ? (
                    <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
                <div className="text-2xl text-gray-400">{step.icon}</div>
              </div>
            </button>

            {/* Connector line between steps */}
            {index < steps.length - 1 && (
              <div className="flex justify-center py-2">
                <div
                  className={`w-1 h-4 ${
                    step.status === 'completed'
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Payment Details (if applicable) */}
      {paymentDetails && currentStatus === 'approved' && (
        <div className="border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Due</h3>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Rent Amount:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                Tsh {paymentDetails.rentAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Service Charge:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                Tsh {paymentDetails.serviceCharge.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-blue-300 pt-3 flex justify-between">
              <span className="font-bold text-gray-900 dark:text-white">Total Amount:</span>
              <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                Tsh {paymentDetails.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Status Message */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Current Status: <span className="font-semibold capitalize">{currentStatus.replace(/_/g, ' ')}</span></p>
      </div>
    </div>
  );
};

export default RentalWorkflowStatus;
