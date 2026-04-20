# Rental Workflow Implementation Guide

## Overview

This document describes the complete rental workflow system implemented in Oweru-Rental. The workflow handles the entire tenant rental process from property discovery through monthly rent payments.

## Workflow Stages

### Stage 1: Property Listed
- **Owner/Dalali** lists a property on the platform
- Property becomes visible to tenants in the **Public Properties** section
- Property details include: title, description, price, location, amenities, images

**Key Files:**
- Backend: `PropertyController::store()`
- Frontend: `AddListing.tsx`, `Properties.tsx`

---

### Stage 2: Tenant Views & Applies
**Tenant Action:** A tenant views property details and submits an application

**Flow:**
1. Tenant visits property detail page
2. Clicks "Apply for Property"
3. Fills out application form:
   - Optional message to owner
   - Counter-offer rent (optional)
4. Submits application

**Backend Process:**
```php
RentalWorkflowController::applyForProperty()
→ RentalWorkflowService::createApplication()
→ Creates Application record with status='pending'
→ NotificationService::notifyOwnerNewApplication()
```

**Frontend Components:**
- `PropertyApplication.tsx` - Application form
- `RentalWorkflowStatus.tsx` - Shows workflow progress

**API Endpoint:**
```
POST /api/workflow/apply
{
  "property_id": 123,
  "message": "I'm a responsible tenant...",
  "offered_rent": 500000
}
```

---

### Stage 3: Owner/Dalali Approves
**Owner Action:** Reviews applications and approves the one they prefer

**Flow:**
1. Owner views "Applications for Property" dashboard
2. Reviews tenant applications
3. Approves (or rejects) selected application

**Backend Process:**
```php
RentalWorkflowController::approveApplication()
→ RentalWorkflowService::approveApplication()
→ Updates Application status='approved'
→ NotificationService::sendApplicationApproved()
→ Sends notification to tenant to proceed with payment
```

**Frontend Components:**
- `ApplicationManagement.tsx` - Review and manage applications

**API Endpoints:**
```
POST /api/workflow/application/{application}/approve
POST /api/workflow/application/{application}/reject
{
  "reason": "Optional rejection reason"
}
```

---

### Stage 4: Tenant Pays First Month Rent
**Tenant Action:** After approval, tenant makes payment for first month rent + service charge

**Payment Breakdown:**
- **Rent Amount:** Property's monthly rent
- **Service Charge:** Platform service fee (configurable)
- **Total Amount:** Sum of above

**Flow:**
1. Tenant navigates to "Make Payment"
2. Enters mobile money phone number
3. System initiates payment via Selcom
4. Tenant receives USSD/SMS prompt on phone
5. Tenant enters PIN to confirm payment

**Backend Process:**
```php
RentalWorkflowController::initiatePayment()
→ PaymentProcessingService::initiateMobileMoneyPayment()
→ Calls Selcom API to create mobile money transaction
→ Returns payment reference to frontend

PaymentProcessingService::handlePaymentWebhook()
→ Receives payment confirmation from Selcom
→ Verifies webhook signature and updates Payment record
→ Allocates commission if agent involved
→ Notifies tenant of payment confirmation
```

**Payment Flow Diagram:**
```
Tenant Phone Number
        ↓
Selcom Mobile Money Initiation
        ↓
Tenant Receives USSD/SMS Prompt (timeout: 2 minutes)
        ↓
Tenant Enters PIN
        ↓
Selcom Processes Payment
        ↓
Webhook → Backend (Payment Confirmation)
        ↓
Contract Activates
```

**Frontend Components:**
- `PaymentInitiation.tsx` - Payment form

**API Endpoints:**
```
POST /api/workflow/initiate-payment/{application}
{
  "phone_number": "+255123456789",
  "service_charge": 50000
}

POST /api/payment/webhook (from Selcom)
{
  "merchant_reference": "RENT-123-xxx",
  "status": "completed",
  "paid": true,
  "amount": 550000,
  "transaction_id": "TXN-xxx"
}
```

**Payment Statuses:**
- `pending` - Awaiting payment completion
- `completed` - Payment successful
- `failed` - Payment failed

---

### Stage 5: System Allocates Commissions
**Automatic Action:** If the property has an agent, commission is calculated and recorded

**Commission Logic:**
- **Commission Percentage:** Default 10% (configurable)
- **Commission Trigger:** When first month rent payment is completed
- **Commission Status:** Initially 'pending', can be marked 'paid' by admin

**Backend Process:**
```php
RentalWorkflowService::processFirstMonthPayment()
→ If property->agent_id exists:
    RentalWorkflowService::allocateCommission()
    → Creates Commission record
    → Commission status = 'pending'
    → Agent can view pending commissions in agent dashboard
```

**Commission Record Fields:**
- `agent_id` - The agent who listed/facilitated
- `property_id` - Related property
- `payment_id` - Related payment
- `amount` - Commission amount
- `percentage` - Commission percentage
- `status` - pending/paid

**API Endpoint (for viewing commissions):**
```
GET /api/agent/my-commissions
```

---

### Stage 6: Contract Activates
**Automatic Action:** Once payment is confirmed, contract is automatically created and activated

**What Happens:**
1. **Tenant Record Created:**
   - Links user to property
   - Records move-in date
   - Status = 'active'

2. **Digital Contract Generated:**
   - Contract start date
   - Contract end date (default: 1 year from start)
   - Rent amount
   - Terms and conditions
   - Status = 'active'

3. **Property Marked Unavailable:**
   - Property.available = false
   - Property no longer appears in search

4. **Notifications Sent:**
   - Tenant receives "Contract Activated" notification
   - Owner receives "Tenant Moved In" notification
   - Month-long guarantee window opens (for both parties)

**Backend Process:**
```php
RentalWorkflowController::completePayment()
→ RentalWorkflowService::processFirstMonthPayment()
→ RentalWorkflowService::activateContract()
  → Tenant::firstOrCreate()
  → Contract::create()
  → Property.update(available=false)
  → NotificationService::sendContractActivated()
→ RentalWorkflowService::scheduleMonthlyReminder()
```

**Contract Record Fields:**
- `tenant_id` - Link to tenant
- `property_id` - Link to property
- `start_date` - Lease start date
- `end_date` - Lease end date
- `rent_amount` - Monthly rent
- `terms` - Contract terms
- `status` - active/terminated

---

### Stage 7: Tenant Receives Monthly Rent Reminders
**Ongoing Action:** System sends payment reminders on schedule and accepts monthly rent payments

#### Monthly Payment Flow

**Next Payment Scheduled:**
- When first month rent payment completes
- Next payment due date = 1 month from payment date
- Payment record created with status='pending'

**Reminder Generation:**
1. **Automated Daily Check** (via scheduled command):
   ```bash
   php artisan reminders:send-monthly-rent
   ```

2. **Reminder Triggers:**
   - **7 days before due:** Standard reminder
   - **3 days before due:** Urgent reminder
   - **Due date:** Final reminder
   - **After due date:** Overdue notices

3. **Notification Sent to Tenant:**
   - Email/SMS (if configured)
   - In-app notification
   - Payment reminder dashboard card

**Payment Acceptance:**
- Tenant can pay anytime after receiving reminder
- Payment accepted before, on, or after due date
- No late penalty (configurable per business rule)

**Backend Process:**
```php
// Scheduled command runs daily:
SendMonthlyRentReminders::handle()
→ Payment::where('type', 'monthly_rent')
         ->where('status', 'pending')
         ->whereBetween('due_date', [now(), now()->addDays(7)])
         ->get()
→ ForEach payment:
    NotificationService::sendMonthlyReminder(payment)
    → Creates in-app notification
    → Marks reminder as sent

// When tenant pays:
RentalWorkflowController::payMonthlyRent()
→ PaymentProcessingService::initiateMobileMoneyPayment()
→ Selcom webhook received
→ RentalWorkflowService::processMonthlyPayment()
  → Payment status = 'completed'
  → Next month's payment scheduled
  → Confirmation notification sent
```

**Frontend Components:**
- `MonthlyPaymentReminder.tsx` - Shows pending & due payments
- Payment card with quick-pay button
- Payment history

**API Endpoints:**
```
GET /api/workflow/pending-payments
→ Returns all pending payments for user

POST /api/workflow/payment/{payment}/pay-monthly
{
  "phone_number": "+255123456789"
}
→ Initiates payment for specific month

GET /api/tenant/payments
→ Returns full payment history
```

**Payment Record Fields (Monthly):**
- `user_id` - Tenant user
- `tenant_id` - Linked tenant
- `property_id` - Linked property
- `type` - 'monthly_rent'
- `amount` - Rent amount
- `status` - pending/completed
- `due_date` - When payment is due
- `paid_at` - When actually paid
- `payment_month` - YYYY-MM for which month
- `is_reminder_sent` - Boolean, tracks if reminder was sent

---

## Service Layer Architecture

### 1. RentalWorkflowService
**Responsibility:** Orchestrates the entire rental workflow

**Key Methods:**
```php
createApplication(User $tenant, Property $property, array $data): Application
approveApplication(Application $application): bool
processFirstMonthPayment(Application $application, array $paymentData): Payment
allocateCommission(Payment $payment, float $commissionPercentage): Commission
activateContract(Application $application, array $contractData): Contract
scheduleMonthlyReminder(Tenant $tenant, Payment $lastPayment): Payment
sendMonthlyReminder(Tenant $tenant, Payment $payment): void
getWorkflowStatus(Property $property, User $tenant): array
```

### 2. PaymentProcessingService
**Responsibility:** Handles all payment-related operations

**Key Methods:**
```php
initiateMobileMoneyPayment(Application $application, string $phoneNumber, float $amount): array
verifyPaymentStatus(Payment $payment): void
handlePaymentWebhook(array $webhookData): void
calculateTotalDue(Application $application): float
getPendingPayments(int $userId): array
```

### 3. NotificationService
**Responsibility:** Sends all notifications throughout workflow

**Key Methods:**
```php
sendPaymentConfirmation(Payment $payment): Notification
sendApplicationApproved($application): Notification
sendApplicationRejected($application): Notification
sendContractActivated(Tenant $tenant): Notification
sendMonthlyReminder(Payment $payment): void
sendPaymentFailed(Payment $payment): Notification
notifyOwnerNewApplication($application): Notification
```

---

## Database Schema

### applications table
```sql
- id
- user_id (FK)
- property_id (FK)
- owner_id (nullable, FK to users)
- status (pending|approved|rejected|withdrawn)
- workflow_status (applied|approved|payment_pending|payment_completed|contract_active)
- message (nullable)
- offered_rent (nullable)
- service_charge (nullable)
- payment_status (nullable)
- payment_method (nullable)
- transaction_id (nullable)
- landlord_notes (nullable)
- applied_at
- responded_at (nullable)
- approved_at (nullable)
- created_at
- updated_at
```

### tenants table
```sql
- id
- user_id (FK)
- property_id (FK)
- move_in_date (nullable)
- lease_start_date (nullable)
- lease_end_date (nullable)
- rent_amount (nullable)
- service_charge (nullable)
- status (active|inactive)
- created_at
- updated_at
```

### payments table
```sql
- id
- user_id (nullable, FK)
- tenant_id (nullable, FK)
- property_id (nullable, FK)
- agent_id (nullable, FK)
- type (first_month_rent|monthly_rent|service_charge)
- amount
- status (pending|completed|failed)
- reference
- payment_month (nullable, YYYY-MM)
- description (nullable)
- due_date (nullable)
- paid_at (nullable)
- is_reminder_sent (boolean, default false)
- metadata (JSON - payment method, phone, etc.)
- created_at
- updated_at
```

### contracts table
```sql
- id
- tenant_id (FK)
- property_id (FK)
- start_date
- end_date (nullable)
- rent_amount
- terms (text)
- status (active|terminated)
- created_at
- updated_at
```

### commissions table
```sql
- id
- agent_id (FK)
- property_id (FK)
- payment_id (FK)
- amount
- percentage (default 10)
- status (pending|paid)
- paid_at (nullable)
- created_at
- updated_at
```

---

## Configuration

### Payment Methods
Configure in environment (.env):
```env
SELCOM_API_KEY=your_key
SELCOM_API_URL=https://api.selcom.com
OWERU_APP_KEY=your_oweru_key
```

### Commission Rules
Default: 10% commission on first month rent
- Configure in `CommissionService` or database settings
- Can be overridden per agent/property

### Service Charges
Configure default service charge amount
- Set in application or configuration file
- Can be overridden per application

### Scheduled Commands
Add to `app/Console/Kernel.php`:
```php
$schedule->command('reminders:send-monthly-rent')
         ->dailyAt('08:00');  // Run daily at 8 AM
```

---

## API Route Summary

### Tenant Routes
```
POST   /api/workflow/apply
GET    /api/workflow/property/{property}/status
GET    /api/workflow/pending-payments
POST   /api/workflow/payment/{payment}/pay-monthly
```

### Owner Routes
```
GET    /api/workflow/property/{property}/applications
POST   /api/workflow/application/{application}/approve
POST   /api/workflow/application/{application}/reject
```

### Payment Routes (Webhook)
```
POST   /api/payment/webhook (from Selcom)
```

---

## Error Handling

### Common Errors

**Validation Errors (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "phone_number": ["Phone number is required"]
  }
}
```

**Authorization Errors (403):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Business Logic Errors (400/409):**
```json
{
  "success": false,
  "message": "Application must be approved before paying"
}
```

**Server Errors (500):**
```json
{
  "success": false,
  "message": "Error: Payment service unavailable"
}
```

---

## Frontend Integration Example

### Complete Application to Payment Flow

```typescript
// 1. Apply for Property
const applyForProperty = async () => {
  const response = await fetch('/api/workflow/apply', {
    method: 'POST',
    body: JSON.stringify({
      property_id: propertyId,
      message: 'I love this place!',
      offered_rent: suggestedRent
    })
  });
  const data = await response.json();
  setApplicationId(data.data.id);
};

// 2. Wait for approval (user checks dashboard)
const checkApplicationStatus = async () => {
  const response = await fetch(`/api/applications/${applicationId}`);
  const data = await response.json();
  if (data.status === 'approved') {
    showPaymentForm = true;
  }
};

// 3. Initiate Payment
const initiatePayment = async (phoneNumber) => {
  const response = await fetch(`/api/workflow/application/${applicationId}/initiate-payment`, {
    method: 'POST',
    body: JSON.stringify({
      phone_number: phoneNumber,
      service_charge: 50000
    })
  });
  const data = await response.json();
  showPaymentPrompt('Check your phone for payment prompt');
};

// 4. Complete Payment (webhook from Selcom triggers this)
// Backend automatically completes payment and activates contract

// 5. View Monthly Reminders
const getMonthlyReminders = async () => {
  const response = await fetch('/api/workflow/pending-payments');
  const data = await response.json();
  setPayments(data.data); // Show payment cards to tenant
};

// 6. Pay Monthly Rent
const payMonthlyRent = async (paymentId, phoneNumber) => {
  const response = await fetch(`/api/workflow/payment/${paymentId}/pay-monthly`, {
    method: 'POST',
    body: JSON.stringify({ phone_number: phoneNumber })
  });
  const data = await response.json();
  showSuccessMessage('Payment initiated!');
};
```

---

## Testing

### Unit Tests for Services

```php
// Test: Apply for property
$tenant = User::factory()->tenant()->create();
$property = Property::factory()->create();

$app = $workflowService->createApplication($tenant, $property, [
    'message' => 'Test',
    'offered_rent' => 500000
]);

$this->assertEquals('pending', $app->status);
```

### Integration Tests

```php
// Test: Full workflow
$this->postJson('/api/workflow/apply', [
    'property_id' => $property->id,
    'offered_rent' => $property->price
])->assertCreated();

$application = Application::first();
$this->postJson("/api/workflow/application/{$application->id}/approve")
      ->assertOk();
```

---

## Troubleshooting

### Issue: Payment webhook not received
- Check Selcom webhook URL configuration
- Verify webhook secret/signature verification
- Check server logs in `storage/logs/`

### Issue: Commission not calculated
- Verify property has agent_id assigned
- Check commission percentage configuration
- Ensure payment status is 'completed'

### Issue: Monthly reminders not sending
- Verify scheduled command is registered in Kernel
- Check command runs with: `php artisan schedule:work`
- Review logs in `storage/logs/laravel.log`

### Issue: Application not visible to owner
- Verify property owner_id matches logged-in user
- Check application status is not 'withdrawn'
- Refresh page to sync with database

---

## Future Enhancements

1. **Automatic Late Payment Penalties:**
   - Add penalty percentage after X days overdue
   - Update payment amount automatically

2. **Lease Renewal:**
   - Automatic contract renewal notifications
   - Option to extend or terminate

3. **Inspection Reports:**
   - Digital inspection before move-in
   - Move-out inspection records

4. **Deposit Management:**
   - Security deposit tracking
   - Return-of-deposit mechanism
   - Deductions for damages

5. **Multi-Payment Options:**
   - Stripe integration
   - Bank transfer
   - Check payments

6. **Analytics Dashboard:**
   - Rental trends
   - Payment analytics
   - Vacancy rates
   - Commission reports

---

## Support

For issues or questions, contact:
- Backend: Backend team
- Frontend: Frontend team
- Payments: Payment gateway support
