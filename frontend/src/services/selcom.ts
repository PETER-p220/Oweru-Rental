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
      
      const requestBody = {
        amount: paymentData.amount,
        currency: 'TZS',
        vendor_id: this.vendorId,
        order_id: orderId,
        phone_number: paymentData.phone_number,
        provider: paymentData.provider,
        webhook_url: `${window.location.origin}/api/payment/webhook`
      };

      const signature = this.generateSignature(requestBody);

      const response = await fetch(`${this.baseUrl}/payments/mobilemoney`, {
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
            transaction_id: result.data?.transaction_id,
            order_id: result.data?.order_id,
            status: result.data?.status
          }
        };
      } else {
        return {
          success: false,
          error: result.error || 'MOBILE_MONEY_FAILED',
          message: result.message || 'Failed to initiate mobile money payment'
        };
      }
    } catch (error) {
      console.error('Selcom mobile money error:', error);
      return {
        success: false,
        error: 'MOBILE_MONEY_ERROR',
        message: 'Network error occurred while initiating mobile money payment'
      };
    }
  }
}

export default new SelcomService();
