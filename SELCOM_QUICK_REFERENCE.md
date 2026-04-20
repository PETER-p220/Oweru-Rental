# Selcom Payment Integration - Quick Reference

## ✅ Your Setup

```
OWERU_APP_KEY=V7pbtmE2QfZxN9rY4kHc3Lw8SgUq1Da5
SELCOM_VENDOR_ID=TILL61224964
SELCOM_API_KEY=TILL61224964-df0113d1e78347e2bb40d17592c47387
SELCOM_API_SECRET=05a99d-ef40c7-46359a-76a9ad-5438e9-5d
SELCOM_IS_LIVE=true
SELCOM_ENVIRONMENT=live
SELCOM_BASE_URL=https://apigw.selcommobile.com/v1
```

✅ All credentials configured in `config/services.php`
✅ PaymentProcessingService uses Selcom API
✅ Webhook handler ready for Selcom callbacks

---

## 🚀 Quick Start

### 1. Clear Config Cache
```bash
php artisan config:cache
```

### 2. Test Configuration
```bash
php artisan tinker
>>> config('services.selcom.api_key')
"TILL61224964-df0113d1e78347e2bb40d17592c47387"
```

### 3. Register Webhook with Selcom
Contact Selcom and register this webhook URL:
```
POST https://your-domain.com/api/payment/webhook
```

---

## 💰 Payment Flow Summary

```
Tenant Phone Input
      ↓
PaymentProcessingService::initiateMobileMoneyPayment()
      ↓
Selcom USSD Push API Call
      ↓
Tenant receives USSD prompt on phone (30 sec)
      ↓
Tenant enters PIN
      ↓
Selcom processes payment (30 sec)
      ↓
Selcom sends webhook: POST /api/payment/webhook
      ↓
PaymentController::handleWebhook()
      ↓
PaymentProcessingService::handlePaymentWebhook()
      ↓
Payment status = 'completed'
      ↓
RentalWorkflowService::activateContract()
      ↓
Tenant receives confirmation notification
```

---

## 🔧 Files Modified/Created

**Backend Services:**
- `PaymentProcessingService.php` - ✅ Now uses real Selcom API
- `PaymentController.php` - ✅ Webhook handler updated
- `config/services.php` - ✅ Selcom credentials configured

**Documentation:**
- `SELCOM_INTEGRATION_GUIDE.md` - Complete integration guide
- `RENTAL_WORKFLOW_GUIDE.md` - Full workflow documentation

---

## 🧪 Test Payment (Example)

### Postman Test for Webhook (Optional)

```
POST http://localhost:8000/api/payment/webhook
Content-Type: application/json

{
  "transid": "RENT-123-test",
  "order_id": "RENT-123-test",
  "resultcode": "000",
  "status": "COMPLETED",
  "reference": "TXN-test-xxx",
  "message": "Test payment"
}
```

### Expected Response
```json
{
  "status": "received"
}
```

---

## 📊 Payment Status Tracking

**In Database:**
```
payments table:
- id
- user_id (tenant)
- reference (Selcom reference)
- type (first_month_rent|monthly_rent)
- amount
- status (pending|completed|failed)
- paid_at (timestamp)
- metadata (includes selcom_transaction_id, phone_number, etc.)
```

**Check Status:**
```bash
php artisan tinker
>>> \App\Models\Payment::where('type', 'first_month_rent')->get()
=> Collection {
     all: [
       {
         id: 1,
         reference: "RENT-123-xxx",
         status: "completed",
         amount: 550000,
         paid_at: "2026-04-20 10:30:45",
       }
     ]
   }
```

---

## 🔐 Security Features

✅ **Phone Number Validation** - Accepts multiple formats, normalizes to Selcom format
✅ **Webhook Signature Verification** - HMAC-SHA256 using SELCOM_API_SECRET
✅ **Payment Reference Tracking** - Unique reference per transaction
✅ **Error Logging** - All Selcom API errors logged to `storage/logs/laravel.log`
✅ **No PIN Storage** - PIN never transmitted to backend

---

## 📝 Important Notes

1. **Live Environment:** Set `SELCOM_IS_LIVE=true` (already done)
2. **Webhook Security:** Only register webhook with Selcom support
3. **Phone Validation:** System handles TZ phone formats automatically
4. **Timeout:** USSD prompt expires after 2 minutes
5. **Monitoring:** Check logs in `storage/logs/laravel.log` for payment events

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing Selcom API configuration" | Run `php artisan config:cache` |
| "Invalid phone number" | Try with country code: `+255123456789` |
| "No webhook received" | Verify webhook URL registered with Selcom |
| "Invalid webhook signature" | Verify SELCOM_API_SECRET matches |

---

## 📊 Commission Flow

When first month rent is paid:

```
Payment Completed: 550,000 TZS
      ↓
Check if property has agent
      ↓
Calculate Commission: 550,000 * 10% = 55,000 TZS
      ↓
Create Commission Record (status: pending)
      ↓
Agent sees pending commission in dashboard
      ↓
Admin marks commission as 'paid'
```

---

## ⏰ Monthly Reminders

**Schedule (add to Kernel):**
```php
$schedule->command('reminders:send-monthly-rent')->dailyAt('08:00');
```

**What happens:**
- Runs daily at 8 AM
- Checks for payments due in next 7 days
- Sends reminder notifications to tenants
- Identifies overdue payments
- Marks reminders as sent

**Tenant sees:**
- Payment reminder card in dashboard
- Due date countdown
- Quick-pay button with phone input
- Payment history

---

## 🎯 Next Steps

1. ✅ Credentials configured in `.env`
2. ✅ Services properly integrated with Selcom API
3. ✅ Run: `php artisan config:cache`
4. 📞 Contact Selcom to register webhook URL
5. 🧪 Test complete payment flow
6. 📋 Monitor first real payments in logs
7. ⏰ Schedule monthly reminder command in production

---

**Status:** ✅ Ready for Payment Processing
**Integration:** ✅ Complete with Live Selcom Credentials
**Testing:** Begin with test transactions, monitor logs
