# Rental Workflow + Selcom Integration - Deploy Checklist

## ✅ Pre-Deployment Verification

### Database
- [ ] Run migration: `php artisan migrate`
- [ ] Verify tables enhanced:
  ```bash
  php artisan tinker
  >>> \DB::getSchemaBuilder()->hasColumn('applications', 'workflow_status')
  true
  >>> \DB::getSchemaBuilder()->hasColumn('payments', 'payment_month')
  true
  ```

### Configuration
- [ ] Clear cache: `php artisan config:cache`
- [ ] Verify Selcom config: `php artisan config:show services.selcom`
- [ ] Test credentials in tinker:
  ```bash
  php artisan tinker
  >>> config('services.selcom.api_key')
  "TILL61224964-df0113d1e78347e2bb40d17592c47387"
  >>> config('services.oweru.app_key')
  "V7pbtmE2QfZxN9rY4kHc3Lw8SgUq1Da5"
  ```

### Services
- [ ] Services created:
  - `app/Services/RentalWorkflowService.php` ✅
  - `app/Services/PaymentProcessingService.php` ✅
  - `app/Services/NotificationService.php` ✅

### Controller
- [ ] Controller created:
  - `app/Http/Controllers/Api/RentalWorkflowController.php` ✅

### Routes
- [ ] Routes added to `routes/api.php`:
  ```bash
  grep -n "RentalWorkflowController" backend/routes/api.php
  ```

### Command
- [ ] Command created:
  - `app/Console/Commands/SendMonthlyRentReminders.php` ✅

---

## 🧪 Local Testing

### 1. Test Payment Service Directly
```bash
cd backend
php artisan tinker

$service = app(\App\Services\PaymentProcessingService::class);
$result = $service->calculateTotalDue(
  \App\Models\Application::first()
);
```

### 2. Test Selcom Configuration
```bash
php artisan tinker
>>> config('services.selcom')
=> [
  'vendor_id' => 'TILL61224964',
  'api_key' => 'TILL61224964-...',
  'api_secret' => '05a99d-...',
  'base_url' => 'https://apigw.selcommobile.com/v1',
  'is_live' => true,
]
```

### 3. Test Payment Workflow Manually
```bash
# 1. Create property
POST /api/properties (as owner)
→ Returns property_id = 1

# 2. Apply for property (as tenant)
POST /api/workflow/apply
{
  "property_id": 1,
  "offered_rent": 500000
}
→ Returns application_id = 1

# 3. Approve application (as owner)
POST /api/workflow/application/1/approve

# 4. Initiate payment (as tenant)
POST /api/workflow/initiate-payment/1
{
  "phone_number": "+255654123456",
  "service_charge": 50000
}
→ Should return payment_id & reference

# 5. Simulate webhook
POST /api/payment/webhook
{
  "transid": "RENT-1-xxx",
  "resultcode": "000",
  "status": "COMPLETED"
}
→ Payment should be marked completed
```

### 4. Check Logs
```bash
tail -f backend/storage/logs/laravel.log

# Look for:
# [INFO] Selcom USSD Push Request
# [INFO] Selcom USSD Push Response
# [INFO] Payment webhook received
# [INFO] Payment marked as completed
```

---

## 🔗 Selcom Webhook Registration

### Contact Selcom Support
```
Email: support@selcom.tz (or your contact)
Message: 
  - Your app name: Oweru Rental
  - Webhook URL: https://your-domain.com/api/payment/webhook
  - API Key: TILL61224964-df0113d1e78347e2bb40d17592c47387
  - Request: Register webhook for payment notifications
```

### Once Registered
```
Selcom will:
1. Verify webhook URL is accessible
2. Send test webhook
3. Provide confirmation
```

### Verify Webhook Works
```bash
# Check if endpoint is accessible
curl -X GET https://your-domain.com/api/payment/webhook
→ Should return 405 (Method Not Allowed) for GET

# This confirms POST is setup
curl -X POST https://your-domain.com/api/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{"status":"test"}'
→ Should return 200 with {"status":"received"}
```

---

## 📋 Frontend Integration Checklist

### Components Created
- [ ] `RentalWorkflowStatus.tsx` ✅
- [ ] `PropertyApplication.tsx` ✅
- [ ] `PaymentInitiation.tsx` ✅
- [ ] `MonthlyPaymentReminder.tsx` ✅
- [ ] `ApplicationManagement.tsx` ✅

### Integration Points
- [ ] Import components in property detail page
- [ ] Import in tenant dashboard
- [ ] Import in owner dashboard
- [ ] API calls use correct endpoints
- [ ] Error handling displays messages
- [ ] Loading states show spinners

### Example Integration
```typescript
import RentalWorkflowStatus from '@/components/RentalWorkflowStatus';
import PropertyApplication from '@/components/PropertyApplication';
import PaymentInitiation from '@/components/PaymentInitiation';

function PropertyDetailPage() {
  return (
    <>
      <RentalWorkflowStatus 
        propertyId={propertyId}
        currentStatus="approved"
      />
      <PropertyApplication 
        propertyId={propertyId}
        onApplicationSubmit={handleApply}
      />
      <PaymentInitiation 
        applicationId={appId}
        rentAmount={500000}
        onPaymentInitiate={handlePayment}
      />
    </>
  );
}
```

---

## 🔐 Security Checklist

### Payment Security
- [ ] Phone numbers never logged in plain text
- [ ] PINs never transmitted to backend
- [ ] Webhook signatures verified with SELCOM_API_SECRET
- [ ] Payment references tracked uniquely
- [ ] HTTPS required for production

### API Security
- [ ] All endpoints require authentication
- [ ] Role-based access control verified
- [ ] Ownership validation before actions
- [ ] Input validation on all endpoints
- [ ] Rate limiting on payment endpoints

### Data Protection
- [ ] No PII stored unnecessarily
- [ ] Passwords hashed (Laravel bcrypt)
- [ ] Database backups scheduled
- [ ] Sensitive data in .env (not in code)
- [ ] Access logs configured

---

## 📊 Monitoring Setup

### Application Logs
```bash
# Location
backend/storage/logs/laravel.log

# Monitor live
tail -f backend/storage/logs/laravel.log | grep "Payment"

# Rotation (daily)
# Configured in config/logging.php
```

### Key Metrics to Track
```
- Payment success rate
- Average payment processing time
- Failed payments (reason)
- Webhook reception rate
- Contract activation rate
- Commission allocation accuracy
```

### Alert Setup
```
For production, setup alerts for:
- Payment failures
- Webhook failures
- Database errors
- API timeouts
- Selcom API errors
```

---

## 📅 Scheduled Commands

### Add to Kernel
```php
// app/Console/Kernel.php
protected function schedule(Schedule $schedule)
{
    // Send monthly rent reminders daily at 8 AM
    $schedule->command('reminders:send-monthly-rent')
             ->dailyAt('08:00')
             ->onSuccess(callback: function () {
                 \Log::info('Monthly reminders sent successfully');
             })
             ->onFailure(callback: function () {
                 \Log::error('Monthly reminders failed');
             });
}
```

### Test Locally
```bash
# Run schedule manually
php artisan schedule:run

# Or test specific command
php artisan reminders:send-monthly-rent
```

### Production Setup
```bash
# Add to crontab (Linux/Mac)
* * * * * cd /path/to/oweru-rental && php artisan schedule:run >> /dev/null 2>&1

# Or Windows Task Scheduler
# Task: Run: C:\php\php.exe -r "cd 'C:\oweru-rental' && artisan schedule:run"
# Schedule: Daily at 8:00 AM
```

---

## 🚀 Deployment Steps

### 1. Pre-Deployment
```bash
cd backend
php artisan down  # Put app in maintenance mode
```

### 2. Deploy Code
```bash
git pull origin main
composer install --optimize-autoloader
npm run build
```

### 3. Database
```bash
php artisan migrate  # Run pending migrations
php artisan db:seed  # Optional: seed data only first time
```

### 4. Cache & Config
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### 5. Verify
```bash
php artisan tinker
>>> config('services.selcom.api_key')
>>> \App\Models\Payment::count()
>>> \App\Models\Application::count()
```

### 6. Go Live
```bash
php artisan up  # Server back online
```

---

## ✨ Final Checklist

### Backend
- [ ] All migrations run
- [ ] Services created
- [ ] Controller integrated
- [ ] Routes registered
- [ ] Config cached
- [ ] Logs accessible
- [ ] Commands scheduled

### Frontend
- [ ] Components created
- [ ] API integration tested
- [ ] Error handling working
- [ ] UI responsive
- [ ] Notifications showing

### Payment Integration
- [ ] Selcom credentials in .env ✅
- [ ] Webhook URL provided to Selcom
- [ ] Test payment flow complete
- [ ] Commission calculation verified
- [ ] Logs monitored

### Operations
- [ ] Database backups scheduled
- [ ] Error alerts configured
- [ ] Monitoring dashboards setup
- [ ] Team trained on system
- [ ] Rollback plan documented

---

## 📞 Support & Documentation

### Files Created
1. **RENTAL_WORKFLOW_GUIDE.md** - Complete workflow documentation
2. **SELCOM_INTEGRATION_GUIDE.md** - Detailed payment integration
3. **SELCOM_QUICK_REFERENCE.md** - Quick reference guide
4. **IMPLEMENTATION_SUMMARY.md** - Implementation overview

### Key Commands
```bash
# Run migrations
php artisan migrate

# Clear cache
php artisan config:cache && php artisan cache:clear

# Test reminders
php artisan reminders:send-monthly-rent

# Monitor logs
tail -f storage/logs/laravel.log

# Database check
php artisan tinker
```

### Support Contacts
- **Selcom:** support@selcommobile.com (or provided contact)
- **Team:** [Your team contact info]

---

## 🎉 Success Criteria

✅ Application submitted successfully
✅ Owner approves application
✅ Tenant receives payment prompt on phone
✅ Payment completed via mobile money
✅ Commission calculated and stored
✅ Contract activated automatically
✅ Monthly reminder sent
✅ Tenant can pay monthly rent
✅ Payment history visible in dashboard

**Once all criteria met, deployment is complete!**

---

**Last Updated:** April 20, 2026
**Status:** Ready for Deployment
**Integration:** Selcom Live ✅
