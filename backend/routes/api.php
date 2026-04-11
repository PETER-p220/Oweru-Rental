<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\OwnerController;
use App\Http\Controllers\Bnb\BnbPropertyController;
use App\Http\Controllers\Bnb\BnbBookingController;
use App\Http\Controllers\Bnb\BnbReviewController;
use App\Http\Controllers\Api\ImageUploadController;
use App\Http\Controllers\Api\PaymentController;

// ── Public routes ─────────────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/logout',   [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Public property routes (no authentication required)
Route::get('/public/properties',           [PropertyController::class, 'publicIndex']);
Route::get('/public/properties/{property}',[PropertyController::class, 'publicShow']);
Route::get('/public/bnb',                 [PropertyController::class, 'publicBnbIndex']);

// Public lead creation (no authentication required)
Route::post('/leads/property/{property}', [LeadController::class, 'createFromProperty']);
Route::post('/leads/contact',             [LeadController::class, 'createFromContact']);

// ── Protected routes ──────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // User
    Route::get('/user', [AuthController::class, 'user']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Properties
    // FIX: /properties/saved MUST come before /properties/{property} so Laravel
    //      does not treat the literal string "saved" as a route-model binding ID.
    Route::get('/properties/saved',        [PropertyController::class, 'saved']);
    Route::get('/properties',              [PropertyController::class, 'index']);
    Route::get('/properties/{property}',   [PropertyController::class, 'show']);
    Route::post('/properties/{property}/save',   [PropertyController::class, 'save']);
    Route::delete('/properties/{property}/save', [PropertyController::class, 'unsave']);

    // Applications
    Route::post('/applications',               [ApplicationController::class, 'store']);
    Route::get('/applications',                [ApplicationController::class, 'index']);
    Route::get('/applications/{application}',  [ApplicationController::class, 'show']);
    Route::put('/applications/{application}',  [ApplicationController::class, 'update']);

    // ── Shared landlord + agent property management ───────────────────────────
    // FIX: Removed duplicate registrations. These were previously registered both
    //      under role:landlord,agent AND role:agent — causing duplicate route entries.
    Route::middleware('role:landlord,agent')->group(function () {
        Route::get('/my-properties',                     [PropertyController::class, 'myProperties']);
        Route::post('/properties',                       [PropertyController::class, 'store']);
        Route::put('/properties/{property}',             [PropertyController::class, 'update']);
        Route::delete('/properties/{property}',          [PropertyController::class, 'destroy']);
        Route::get('/properties/{property}/analytics',   [PropertyController::class, 'analytics']);
    });

    // ── Tenant routes ─────────────────────────────────────────────────────────
    Route::middleware('role:tenant')->group(function () {
        Route::get('/tenant/dashboard', [TenantController::class, 'getDashboard']);

        // Saved Properties
        Route::get('/tenant/saved-properties',                    [TenantController::class, 'getSavedProperties']);
        Route::post('/tenant/properties/{property}/save',         [TenantController::class, 'saveProperty']);
        Route::delete('/tenant/properties/{property}/save',       [TenantController::class, 'unsaveProperty']);

        // Applications
        Route::get('/tenant/applications',  [TenantController::class, 'getApplications']);
        Route::post('/tenant/applications', [TenantController::class, 'createApplication']);

        // Payment routes (for tenants to make payments)
        Route::post('/payment/selcom/mobile-money', [PaymentController::class, 'initiateMobileMoney']);
        Route::post('/payment/webhook', [PaymentController::class, 'handleWebhook']);

        // Contracts
        Route::get('/tenant/contract',                           [TenantController::class, 'getMyContract']);
        Route::get('/tenant/contracts/{contract}/download',      [TenantController::class, 'downloadContract']);

        // Payments
        Route::get('/tenant/payments',                           [TenantController::class, 'getMyPayments']);
        Route::get('/tenant/payment-methods',                    [TenantController::class, 'getPaymentMethods']);
        Route::get('/tenant/payment-stats',                      [TenantController::class, 'getPaymentStats']);
        Route::post('/tenant/payments/{payment}/pay',            [TenantController::class, 'makePayment']);
        Route::get('/tenant/payment-history',                    [TenantController::class, 'getPaymentHistory']);
        Route::get('/tenant/payment-summary',                    [TenantController::class, 'getPaymentSummary']);
        Route::get('/tenant/payments/{payment}/receipt',         [TenantController::class, 'downloadReceipt']);

        // Notifications
        // FIX: Static route /read-all MUST come before parameterised /{notification}/...
        //      routes, otherwise Laravel matches "read-all" as a notification ID.
        Route::get('/tenant/notifications',                          [TenantController::class, 'getNotifications']);
        Route::get('/tenant/notification-stats',                     [TenantController::class, 'getNotificationStats']);
        Route::patch('/tenant/notifications/read-all',               [TenantController::class, 'markAllNotificationsAsRead']);
        Route::patch('/tenant/notifications/{notification}/read',    [TenantController::class, 'markNotificationAsRead']);
        Route::patch('/tenant/notifications/{notification}/archive', [TenantController::class, 'archiveNotification']);
        Route::delete('/tenant/notifications/{notification}',        [TenantController::class, 'deleteNotification']);

        // Messages
        Route::get('/tenant/messages',  [TenantController::class, 'getMessages']);
        Route::post('/tenant/messages', [TenantController::class, 'sendMessage']);

        // Analytics
        Route::get('/tenant/analytics', [TenantController::class, 'getAnalytics']);
    });

    // ── Agent routes ──────────────────────────────────────────────────────────
    Route::middleware('role:agent')->group(function () {
        // Dashboard
        Route::get('/agent/dashboard', [AgentController::class, 'getDashboard']);

        // Listings (agent-scoped, separate from the shared /properties routes above)
        Route::get('/agent/my-listings',                        [AgentController::class, 'getMyListings']);
        Route::post('/agent/listings',                          [AgentController::class, 'createListing']);
        Route::put('/agent/listings/{property}',                [AgentController::class, 'updateListing']);
        Route::delete('/agent/listings/{property}',             [AgentController::class, 'deleteListing']);
        Route::get('/agent/listings/{property}/analytics',      [AgentController::class, 'getPropertyAnalytics']);
        Route::post('/agent/listings/{property}/share',        [AgentController::class, 'recordShare']);

        // Linked Owners
        Route::get('/agent/linked-owners',  [AgentController::class, 'getLinkedOwners']);
        Route::post('/agent/link-owner',    [AgentController::class, 'linkOwner']);

        // Tracking
        Route::get('/agent/tracking',              [AgentController::class, 'getTrackingLinks']);
        Route::post('/agent/track-share',         [AgentController::class, 'trackShare']);
        Route::get('/agent/debug-property/{id}', [AgentController::class, 'debugProperty']);
        Route::get('/agent/qr-codes/{property}',   [AgentController::class, 'generateQRCode']);

        // Notifications
        Route::get('/notifications/agent',  [AgentController::class, 'getAgentNotifications']);
        Route::post('/notifications/agent', [AgentController::class, 'notifyAgent']);

        // Leads
        Route::get('/agent/leads',      [AgentController::class, 'getLeads']);
        Route::get('/agent/lead-stats', [AgentController::class, 'getLeadStats']);

        // Applications
        Route::get('/agent/applications', [AgentController::class, 'getApplications']);

        // Commissions
        Route::get('/agent/my-commissions',   [AgentController::class, 'getMyCommissions']);
        Route::get('/agent/commission-stats', [AgentController::class, 'getCommissionStats']);
        Route::get('/agent/payouts',          [AgentController::class, 'getPayoutHistory']);

        // Analytics
        Route::get('/agent/analytics', [AgentController::class, 'getAnalytics']);

        // Messages
        Route::get('/agent/messages',  [AgentController::class, 'getMessages']);
        Route::post('/agent/messages', [AgentController::class, 'sendMessage']);
    });

    // ── Owner (landlord) routes ───────────────────────────────────────────────
    Route::middleware('role:landlord')->group(function () {
        Route::get('/owner/dashboard', [OwnerController::class, 'getDashboard']);

        // Properties Management
        Route::get('/owner/my-properties',                      [OwnerController::class, 'getMyProperties']);
        Route::post('/owner/properties',                        [OwnerController::class, 'createProperty']);
        Route::put('/owner/properties/{property}',              [OwnerController::class, 'updateProperty']);
        Route::delete('/owner/properties/{property}',           [OwnerController::class, 'deleteProperty']);
        Route::get('/owner/properties/{property}/analytics',    [OwnerController::class, 'getPropertyAnalytics']);

        // Applications Management
        Route::get('/owner/applications',                               [OwnerController::class, 'getApplications']);
        Route::patch('/owner/applications/{application}/approve',       [OwnerController::class, 'approveApplication']);
        Route::patch('/owner/applications/{application}/reject',        [OwnerController::class, 'rejectApplication']);

        // Tenants
        Route::get('/owner/tenants', [OwnerController::class, 'getMyTenants']);
        Route::post('/owner/tenants/create-from-approved', [OwnerController::class, 'createTenantFromApprovedApplication']);

        // Contracts
        Route::get('/owner/contracts',  [OwnerController::class, 'getContracts']);
        Route::post('/owner/contracts', [OwnerController::class, 'createContract']);

        // Rent Collection
        Route::get('/owner/rent-collection',       [OwnerController::class, 'getRentCollection']);
        Route::get('/owner/rent-collection-stats', [OwnerController::class, 'getRentCollectionStats']);

        // Payment Receipts
        Route::get('/owner/receipts',                        [OwnerController::class, 'getReceipts']);
        Route::get('/owner/receipts/{payment}/download',     [OwnerController::class, 'downloadReceipt']);

        // Commission Reports
        Route::get('/owner/commission-reports', [OwnerController::class, 'getCommissionReports']);

        // Analytics
        Route::get('/owner/analytics', [OwnerController::class, 'getAnalytics']);

        // Messages
        Route::get('/owner/messages',  [OwnerController::class, 'getMessages']);
        Route::post('/owner/messages', [OwnerController::class, 'sendMessage']);
    });

    // ── Admin routes ──────────────────────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        // Users
        Route::get('/admin/users',                   [AdminController::class, 'getUsers']);
        Route::get('/admin/users/stats',             [AdminController::class, 'getUserStats']);
        Route::post('/admin/users',                  [AdminController::class, 'createUser']);
        Route::put('/admin/users/{user}',            [AdminController::class, 'updateUser']);
        Route::delete('/admin/users/{user}',         [AdminController::class, 'deleteUser']);
        Route::patch('/admin/users/{user}/status',   [AdminController::class, 'updateUserStatus']);

        // Properties
        Route::get('/admin/properties',       [AdminController::class, 'getProperties']);
        Route::get('/admin/properties/stats', [AdminController::class, 'getPropertyStats']);

        // Transactions
        Route::get('/admin/transactions',                       [AdminController::class, 'getTransactions']);
        Route::get('/admin/transactions/stats',                 [AdminController::class, 'getTransactionStats']);
        Route::patch('/admin/transactions/{transaction}/status',[AdminController::class, 'updateTransactionStatus']);
        Route::delete('/admin/transactions/{transaction}',      [AdminController::class, 'deleteTransaction']);

        // Contracts
        Route::get('/admin/contracts',       [AdminController::class, 'getContracts']);
        Route::get('/admin/contracts/stats', [AdminController::class, 'getContractStats']);

        // Commission Control
        Route::get('/admin/commission/rules',                              [AdminController::class, 'getCommissionRules']);
        Route::get('/admin/commission/payments',                           [AdminController::class, 'getCommissionPayments']);
        Route::get('/admin/commission/stats',                              [AdminController::class, 'getCommissionStats']);
        Route::patch('/admin/commission/payments/{commission}/status',     [AdminController::class, 'updateCommissionPaymentStatus']);

        // System Settings
        Route::get('/admin/settings', [AdminController::class, 'getSettings']);
        Route::put('/admin/settings', [AdminController::class, 'updateSettings']);

        // Verification
        Route::get('/admin/verification/requests', [AdminController::class, 'getVerificationRequests']);
        Route::get('/admin/verification/stats',    [AdminController::class, 'getVerificationStats']);

        // Alerts
        Route::get('/admin/alerts',       [AdminController::class, 'getAlerts']);
        Route::get('/admin/alerts/stats', [AdminController::class, 'getAlertStats']);

        // BNB Management
        Route::get('/admin/bnb/properties',       [AdminController::class, 'getAdminBnbProperties']);
        Route::patch('/admin/bnb/properties/{property}/status', [AdminController::class, 'updateAdminBnbPropertyStatus']);
        Route::get('/admin/bnb/bookings',          [AdminController::class, 'getAdminBnbBookings']);
        Route::get('/admin/bnb/analytics',         [AdminController::class, 'getAdminBnbAnalytics']);
    });

    // ── BNB Owner routes ─────────────────────────────────────────────────────────────
    Route::middleware(['auth:sanctum', 'role:bnb_owner'])->group(function () {
        // Properties
        Route::get('/bnb/properties',            [BnbPropertyController::class, 'index']);
        Route::post('/bnb/properties',           [BnbPropertyController::class, 'store']);
        Route::get('/bnb/properties/{property}', [BnbPropertyController::class, 'show']);
        Route::put('/bnb/properties/{property}',  [BnbPropertyController::class, 'update']);
        Route::delete('/bnb/properties/{property}', [BnbPropertyController::class, 'destroy']);
        Route::get('/bnb/analytics',              [BnbPropertyController::class, 'analytics']);

        // Bookings
        Route::get('/bnb/bookings',              [BnbBookingController::class, 'index']);
        Route::get('/bnb/bookings/{booking}',     [BnbBookingController::class, 'show']);
        Route::patch('/bnb/bookings/{booking}/status', [BnbBookingController::class, 'updateStatus']);

        // Reviews
        Route::get('/bnb/reviews',               [BnbReviewController::class, 'index']);
        Route::get('/bnb/reviews/{review}',        [BnbReviewController::class, 'show']);
        Route::post('/bnb/reviews/{review}/respond', [BnbReviewController::class, 'respond']);
        
        // ── Image Upload routes ───────────────────────────────────────────────────────
        Route::post('/upload-image',                [ImageUploadController::class, 'upload']);
        Route::post('/upload-images',               [ImageUploadController::class, 'uploadMultiple']);
        Route::delete('/delete-image',               [ImageUploadController::class, 'delete']);

        // ── Site Visit routes ─────────────────────────────────────────────────────────
        // Route::get('/site-visits',                  [SiteVisitController::class, 'getMyVisits']);
        // Route::post('/site-visits',                  [SiteVisitController::class, 'requestVisit']);
        // Route::patch('/site-visits/{visit}/confirm', [SiteVisitController::class, 'confirmVisit']);
        // Route::patch('/site-visits/{visit}/cancel',  [SiteVisitController::class, 'cancelVisit']);
        // Route::get('/site-visits/notifications',    [SiteVisitController::class, 'getNotifications']);
        // Route::patch('/notifications/{notification}/read', [SiteVisitController::class, 'markNotificationRead']);
    });

    // ── Public BNB routes ─────────────────────────────────────────────────────────────
    Route::get('/public/bnb/search',            [BnbPropertyController::class, 'search']);
    Route::get('/public/bnb/properties/{property}', [BnbPropertyController::class, 'show']);
    Route::post('/public/bnb/bookings',           [BnbBookingController::class, 'store']);
    Route::post('/public/bnb/properties/{property}/reviews', [BnbReviewController::class, 'store']);

    // ── Payment webhook routes ───────────────────────────────────────────────────────
    // Route::post('/payment/webhook',              [PaymentWebhookController::class, 'handleSelcomWebhook']);
});