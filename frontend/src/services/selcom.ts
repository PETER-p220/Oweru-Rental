// Selcom Payment API Integration
interface SelcomPaymentRequest {
  amount: number;
  currency: string;
  vendor_id: string;
  order_id: string;
  customer_email?: string;
  customer_phone?: string;
  customer_name?: string;
  redirect_url?: string;
  webhook_url?: string;
}

interface SelcomPaymentResponse {
  success: boolean;
  data?: {
    payment_url?: string;
    transaction_id?: string;
    order_id?: string;
    status?: string;
  };
  error?: string;
  message?: string;
}

class SelcomService {
  private readonly baseUrl = 'https://apigw.selcommobile.com/v1';
  private readonly vendorId = 'TILL61224964';
  private readonly apiKey = 'TILL61224964-df0113d1e78347e2bb40d17592c47387';
  private readonly apiSecret = '05a99d-ef40c7-46359a-76a9ad-5438e9-5d';
  private readonly isLive = true;

  private generateOrderId(): string {
    return `OWERU_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSignature(data: any): string {
    // In a real implementation, you'd create a proper HMAC signature
    // For now, return a placeholder
    return btoa(JSON.stringify(data)).substr(0, 32);
  }

  async initiatePayment(paymentData: {
    amount: number;
    property_id: number;
    tenant_id: number;
    phone_number?: string;
    customer_email?: string;
    customer_name?: string;
  }): Promise<SelcomPaymentResponse> {
    try {
      const orderId = this.generateOrderId();
      
      const requestBody: SelcomPaymentRequest = {
        amount: paymentData.amount,
        currency: 'TZS',
        vendor_id: this.vendorId,
        order_id: orderId,
        customer_email: paymentData.customer_email,
        customer_phone: paymentData.phone_number,
        customer_name: paymentData.customer_name,
        redirect_url: `${window.location.origin}/payment/success`,
        webhook_url: `${window.location.origin}/api/payment/webhook`
      };

      // Add signature for authentication
      const signature = this.generateSignature(requestBody);

      const response = await fetch(`${this.baseUrl}/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'X-API-Signature': signature,
          'X-Vendor-ID': this.vendorId,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        return {
          success: true,
          data: {
            payment_url: result.data?.payment_url,
            transaction_id: result.data?.transaction_id,
            order_id: result.data?.order_id,
            status: result.data?.status
          }
        };
      } else {
        return {
          success: false,
          error: result.error || 'PAYMENT_INIT_FAILED',
          message: result.message || 'Failed to initiate payment'
        };
      }
    } catch (error) {
      console.error('Selcom payment error:', error);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network error occurred while initiating payment'
      };
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<SelcomPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/status/${transactionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'X-Vendor-ID': this.vendorId,
        },
      });

      const result = await response.json();

      return {
        success: response.ok,
        data: {
          status: result.data?.status,
          transaction_id: result.data?.transaction_id,
          order_id: result.data?.order_id
        },
        message: result.message
      };
    } catch (error) {
      console.error('Selcom status check error:', error);
      return {
        success: false,
        error: 'STATUS_CHECK_FAILED',
        message: 'Failed to check payment status'
      };
    }
  }

  // For mobile money (Tigo Pesa, M-Pesa, Airtel Money)
  async initiateMobileMoneyPayment(paymentData: {
    amount: number;
    phone_number: string;
    provider: 'tigo' | 'mpesa' | 'airtel';
    property_id: number;
    tenant_id: number;
  }): Promise<SelcomPaymentResponse> {
    try {
      const orderId = this.generateOrderId();
      
      // Real Selcom API endpoint for mobile money
      const requestBody = {
        amount: paymentData.amount,
        currency: 'TZS',
        vendor_id: this.vendorId,
        order_id: orderId,
        phone_number: paymentData.phone_number,
        provider: paymentData.provider.toUpperCase(),
        customer_email: `${paymentData.tenant_id}@oweru.com`, // Fallback email
        customer_name: `Tenant ${paymentData.tenant_id}`,
        webhook_url: `${window.location.origin}/api/payment/webhook`,
        redirect_url: `${window.location.origin}/payment/success`
      };

      console.log('🚀 Initiating Selcom Payment:', requestBody);

      // Handle CORS by using mode: 'cors' and proper headers
      const response = await fetch(`${this.baseUrl}/payments/mobilemoney`, {
        method: 'POST',
        mode: 'cors', // Enable CORS
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Vendor-ID': this.vendorId,
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Selcom Response Status:', response.status);
      console.log('📡 Selcom Response Headers:', [...response.headers.entries()]);

      const result = await response.json();
      console.log('📱 Selcom Response:', result);

      // Handle CORS and API errors
      if (!response.ok) {
        if (response.status === 0) {
          return {
            success: false,
            error: 'NETWORK_ERROR',
            message: 'Network error: Unable to connect to Selcom API. Please check your internet connection.'
          };
        } else if (response.status === 403) {
          return {
            success: false,
            error: 'AUTHENTICATION_ERROR',
            message: 'Authentication failed: Invalid API credentials or vendor ID.'
          };
        } else if (response.status === 422) {
          return {
            success: false,
            error: 'VALIDATION_ERROR',
            message: result.message || 'Invalid payment data provided.'
          };
        } else {
          return {
            success: false,
            error: 'API_ERROR',
            message: `Selcom API error (${response.status}): ${result.message || result.error_description || 'Unknown error'}`
          };
        }
      }

      if (response.ok && (result.success || result.status === 'success')) {
        return {
          success: true,
          data: {
            transaction_id: result.data?.transaction_id || result.transaction_id || orderId,
            order_id: result.data?.order_id || orderId,
            status: result.data?.status || result.status || 'pending'
          }
        };
      } else {
        return {
          success: false,
          error: result.error || 'MOBILE_MONEY_FAILED',
          message: result.message || result.error_description || 'Failed to initiate mobile money payment'
        };
      }
    } catch (error) {
      console.error('❌ Selcom mobile money error:', error);
      
      // Handle specific error types
      if (error instanceof TypeError) {
        return {
          success: false,
          error: 'NETWORK_ERROR',
          message: 'Network error: Unable to connect to payment service. Please try again.'
        };
      }
      
      return {
        success: false,
        error: 'MOBILE_MONEY_ERROR',
        message: `Payment error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export default new SelcomService();
