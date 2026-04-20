# Selcom Payment Integration Guide

## Overview

The rental workflow system is fully integrated with Selcom's payment gateway using your OWERU_APP_KEY and Selcom credentials for secure mobile money payments.

## Configuration

Your `.env` file is already configured with:

```env
OWERU_APP_KEY=V7pbtmE2QfZxN9rY4kHc3Lw8SgUq1Da5
SELCOM_VENDOR_ID=TILL61224964
SELCOM_API_KEY=TILL61224964-df0113d1e78347e2bb40d17592c47387
SELCOM_API_SECRET=05a99d-ef40c7-46359a-76a9ad-5438e9-5d
SELCOM_IS_LIVE=true    
SELCOM_ENVIRONMENT=live
SELCOM_BASE_URL=https://apigw.selcommobile.com/v1
```

These credentials are automatically loaded into `config/services.php` and used throughout the application.

## Payment Flow

### 1. Tenant Initiates Payment

**Endpoint:** `POST /api/workflow/initiate-payment/{application}`

```json
{
  "phone_number": "+255123456789",
  "service_charge": 50000
}
```

**Backend Process:**
```
PaymentInitiation.tsx
    ↓
RentalWorkflowController::initiatePayment()
    ↓
PaymentProcessingService::initiateMobileMoneyPayment()
    ↓
callSelcomAPI() (USSD Push)
    ↓
Tenant receives USSD prompt on phone
    ↓
Tenant enters PIN
    ↓
Selcom processes payment
```

### 2. Selcom Webhook Confirmation

Once tenant completes payment, Selcom sends webhook to:

**Endpoint:** `POST /api/payment/webhook`

**Webhook Payload:**
```json
{
  "transid": "RENT-123-xxx",
  "order_id": "RENT-123-xxx",
  "resultcode": "000",
  "status": "COMPLETED",
  "reference": "TXN-xxx",
  "message": "Payment successful",
  "timestamp": "2026-04-20 10:30:00"
}
```

**Backend Process:**
```
PaymentController::handleWebhook()
    ↓
Verify webhook signature (SELCOM_API_SECRET)
    ↓
PaymentProcessingService::handlePaymentWebhook()
    ↓
Mark Payment status = 'completed'
    ↓
RentalWorkflowService::activateContract()
    ↓
Create Contract & Tenant records
    ↓
NotificationService::sendPaymentConfirmation()
    ↓
Tenant receives confirmation
```

## API Integration Details

### Selcom USSD Push Request

```php
POST https://apigw.selcommobile.com/v1/ussd/initiate
Headers:
  - X-API-Key: TILL61224964-df0113d1e78347e2bb40d17592c47387
  - Accept: application/json
  - Content-Type: application/json

Body:
{
  "app_key": "V7pbtmE2QfZxN9rY4kHc3Lw8SgUq1Da5",
  "vendor_id": "TILL61224964",
  "phone": "255123456789",
  "amount": 550000,
  "reference": "RENT-123-xxx",
  "merchant_name": "Oweru Rental",
  "merchant_transaction_id": "RENT-123-xxx",
  "description": "Oweru Rental - first_month_rent",
  "currency": "TZS",
  "callback_url": "https://your-domain.com/api/payment/webhook"
}
```

### Selcom Response Format

**Success Response:**
```json
{
  "status": "success",
  "reference": "REF-xxx",
  "transaction_id": "TXN-xxx",
  "message": "USSD request successfully sent"
}
```

## Phone Number Handling

The system automatically handles various phone number formats:

- ✅ `+255123456789` → `255123456789`
- ✅ `0123456789` → `255123456789`
- ✅ `123456789` → `255123456789`
- ✅ `255123456789` → `255123456789`

All are normalized to the Selcom required format: `255XXXXXXXXX`

## Payment Processing Service

### Key Methods

```php
// Initiate payment
PaymentProcessingService::initiateMobileMoneyPayment(
    $application,      // Application model
    $phoneNumber,      // Phone number (any format)
    $amount,          // Total amount (rent + service charge)
    'first_month_rent' // Payment type
): array // Returns [success, payment_id, reference]

// Handle webhook
PaymentProcessingService::handlePaymentWebhook(array $webhookData): void

// Verify payment
PaymentProcessingService::verifyPaymentStatus(Payment $payment): void

// Calculate total due
PaymentProcessingService::calculateTotalDue(Application $application): float

// Get pending payments
PaymentProcessingService::getPendingPayments(int $userId): array
```

## Webhook Security

### Signature Verification

Selcom webhooks are verified using HMAC-SHA256:

```php
$expectedSignature = hash_hmac(
    'sha256',
    json_encode($webhookData),
    config('services.selcom.api_secret')
);

// Compare with provided signature
hash_equals($expectedSignature, $providedSignature)
```

## Payment Types

### 1. First Month Rent
- **Status:** Paid immediately
- **Amount:** Rent + service charge
- **Trigger:** Application approved → Tenant chooses to pay
- **Next Step:** Contract activation

### 2. Monthly Rent
- **Status:** Due each month
- **Amount:** Property's monthly rent
- **Trigger:** Scheduled reminder 7 days before due date
- **Next Step:** Next month's payment scheduled

### 3. Service Charge
- **Status:** Can be standalone
- **Amount:** Platform fee (configurable)
- **Trigger:** Can be included in first month or separate

## Error Handling

### Payment Failures

**Reasons for failure:**
- Invalid phone number
- Insufficient balance
- Wrong PIN entered
- Network timeout (2 minute USSD timeout)
- Unsupported network
- Tenant cancels prompt

**Response on failure:**
```json
{
  "success": false,
  "message": "Error: Payment failed - Insufficient funds"
}
```

**What happens:**
```
Tenant notified via notification
Payment status = 'failed'
Application stays in 'approved' state
Tenant can retry with different phone/amount
```

## Testing Payment Integration

### 1. Test Environment Setup

**In .env (for testing):**
```env
SELCOM_IS_LIVE=false
SELCOM_ENVIRONMENT=sandbox
SELCOM_BASE_URL=https://sandbox.selcom.com/v1
```

### 2. Test Payment Flow

**Step 1: Create property**
```bash
POST /api/properties
{
  "title": "Test Property",
  "price": 500000,
  ...
}
```

**Step 2: Apply for property (as tenant)**
```bash
POST /api/workflow/apply
{
  "property_id": 1,
  "offered_rent": 500000
}
```

**Step 3: Approve application (as owner)**
```bash
POST /api/workflow/application/1/approve
```

**Step 4: Initiate payment (as tenant)**
```bash
POST /api/workflow/initiate-payment/1
{
  "phone_number": "+255654123456",
  "service_charge": 50000
}
```

**Step 5: Receive Payment Prompt**
- Tenan receives USSD prompt on phone (usually within 30 seconds)
- Prompt expires in 2 minutes
- Tenant enters PIN

**Step 6: Webhook Confirmation**
- Selcom sends webhook when payment completes
- Backend processes payment
- Contract activated
- Tenant receives confirmation

### 3. Check Payment Status

```bash
GET /api/workflow/pending-payments

Response:
[
  {
    "id": 1,
    "amount": 550000,
    "due_date": "2026-04-20",
    "status": "completed",
    "property_title": "Test Property",
    "type": "first_month_rent"
  }
]
```

## Logging & Monitoring

### Payment Logs Location
```
storage/logs/laravel.log
```

### Key Log Messages

**Successful Payment:**
```
[2026-04-20 10:30:00] local.INFO: Selcom USSD Push Request {"reference":"RENT-123-xxx",...}
[2026-04-20 10:30:05] local.INFO: Selcom USSD Push Response {"status":200,"response":{"status":"success",...}}
[2026-04-20 10:30:45] local.INFO: Payment webhook received {"transid":"RENT-123-xxx","status":"COMPLETED",...}
[2026-04-20 10:30:46] local.INFO: Payment marked as completed {"payment_id":1,...}
```

**Failed Payment:**
```
[2026-04-20 10:30:00] local.ERROR: Selcom API Error {"error":"Invalid phone number",...}
[2026-04-20 10:32:00] local.WARNING: Selcom payment not successful via webhook {"resultcode":"001",...}
```

## Commission Calculation

When first month rent is paid, commission is automatically calculated:

**Formula:**
```
Commission Amount = (Rent + Service Charge) * Commission Percentage / 100
```

**Example:**
```
Rent: 500,000 TZS
Service Charge: 50,000 TZS
Total: 550,000 TZS
Commission %: 10%
Commission: 550,000 * 10 / 100 = 55,000 TZS
```

**Configuration:**
```env
# In .env
PAYMENT_COMMISSION_PERCENTAGE=10

# Or override in PaymentProcessingService
$commissionAmount = ($payment->amount * 12) / 100; // 12% instead of 10%
```

## Monthly Rent Payment Flow

### Scheduled Reminder Setup

**Add to Kernel (app/Console/Kernel.php):**
```php
protected function schedule(Schedule $schedule)
{
    $schedule->command('reminders:send-monthly-rent')
             ->dailyAt('08:00');  // 8 AM daily
}
```

### Payment Schedule

```
Month 1: Tenant pays first month rent
         ↓
30 days later: Payment due date
         ↓
23 days later: Reminder sent (7 days before)
         ↓
Tenant pays monthly rent
         ↓
30 days later: Next payment due
         ↓
Repeat...
```

### Reminder Notifications

**7 Days Before:**
```
Title: 📅 Monthly Rent Reminder
Message: Your monthly rent of Tsh 500,000 for Test Property is due on 2026-05-20. (7 days remaining)
```

**3 Days Before:**
```
Title: 📅 Monthly Rent Reminder
Message: Your monthly rent of Tsh 500,000 for Test Property is due on 2026-05-20. (3 days remaining)
```

**Due Date:**
```
Title: ⏰ Rent Due Today
Message: Your monthly rent of Tsh 500,000 for Test Property is due TODAY.
```

**Overdue:**
```
Title: ⚠️ Overdue Payment
Message: Your monthly rent of Tsh 500,000 for Test Property is OVERDUE since 2026-05-20. Please make payment immediately.
```

## Webhook Configuration with Selcom

### Register Webhook URL

Contact Selcom support to register:

```
https://your-domain.com/api/payment/webhook
```

### Webhook Headers Expected

```
X-Signature: hmac256_hash
X-Timestamp: 1713607800
X-Webhook-Token: xxxxx
```

### Test Webhook (Manual)

```bash
curl -X POST https://your-domain.com/api/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transid": "RENT-123-test",
    "order_id": "RENT-123-test",
    "resultcode": "000",
    "status": "COMPLETED",
    "reference": "TXN-test",
    "message": "Test webhook"
  }'
```

## Troubleshooting

### Issue: "Missing Selcom API configuration"

**Solution:**
1. Verify .env has all Selcom variables
2. Run: `php artisan config:cache`
3. Check: `php artisan config:show services.selcom`

### Issue: "Invalid webhook signature"

**Solution:**
1. Verify SELCOM_API_SECRET in .env is correct
2. Check webhook includes X-Signature header
3. Ensure signature calculation uses same secret

### Issue: "Payment initiated but no webhook received"

**Solution:**
1. Check if webhook URL is publicly accessible
2. Verify webhook URL registered with Selcom
3. Check server logs for webhook receipt: `tail -f storage/logs/laravel.log`
4. Test webhook manually using curl command above

### Issue: "Phone number format error"

**Solution:**
- System accepts multiple formats - should auto-normalize
- If still failing, try: `+255123456789` (with + sign)
- Check logs for exact error from Selcom

## Production Deployment Checklist

- [ ] Set `SELCOM_IS_LIVE=true` and `SELCOM_ENVIRONMENT=live`
- [ ] Verify SELCOM_API_KEY, SELCOM_API_SECRET with Selcom live credentials
- [ ] Register webhook URL with Selcom support
- [ ] Test complete payment flow (app → pay → webhook)
- [ ] Monitor first few payments in logs
- [ ] Setup log rotation: `storage/logs/laravel.log`
- [ ] Enable HTTPS for webhook security
- [ ] Test automated monthly reminders
- [ ] Setup error alerts/monitoring

## Support

For Selcom API issues:
- Contact: Selcom support
- Docs: https://selcommobile.com/api-docs

For integration issues:
- Check: `storage/logs/laravel.log`
- Review: Payment webhook entries
- Test: Manual webhook using curl
