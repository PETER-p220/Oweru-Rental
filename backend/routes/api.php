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
use App\Http\Controllers\Api\RentalWorkflowController;
use App\Http\Controllers\Bnb\BnbPropertyController;
use App\Http\Controllers\Bnb\BnbBookingController;
use App\Http\Controllers\Bnb\BnbReviewController;
use App\Http\Controllers\Api\ImageUploadController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Commercial\PropertyController as CommercialPropertyController;
use App\Http\Controllers\Commercial\CommercialController;
use App\Http\Controllers\MessageController;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES  (no authentication required)
// ─────────────────────────────────────────────────────────────────────────────

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/logout',   [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Google OAuth routes
Route::get('/auth/google/redirect', [AuthController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback']);
Route::get('/auth/google/register/redirect', [AuthController::class, 'redirectToGoogleRegister']);
Route::post('/auth/google', [AuthController::class, 'loginWithGoogle']);
Route::post('/auth/google/register', [AuthController::class, 'registerWithGoogle']);

// Public property routes
Route::get('/public/properties',            [PropertyController::class, 'publicIndex']);
Route::get('/public/properties/{property}', [PropertyController::class, 'publicShow']);
Route::get('/public/bnb',                   [PropertyController::class, 'publicBnbIndex']);

// Public lead creation (property contact forms)
Route::post('/public/properties/{property}/leads', [AgentController::class, 'createLead']);

// Public BNB routes — MUST be outside auth middleware
Route::get('/public/bnb/search',                          [BnbPropertyController::class, 'search']);
Route::get('/public/bnb/properties/{property}',           [BnbPropertyController::class, 'publicShow']);
Route::get('/public/bnb/properties/{property}/reviews',   [BnbReviewController::class, 'propertyReviews']);
Route::post('/public/bnb/bookings',                       [BnbBookingController::class, 'store']);
Route::post('/public/bnb/book',                           [BnbBookingController::class, 'store']);

// Debug route — REMOVE IN PRODUCTION
Route::get('/debug/properties', [PropertyController::class, 'debugProperties']);

// Payment webhook (public — Selcom/Oweru callbacks cannot send Bearer tokens)
Route::post('/payment/webhook', [PaymentController::class, 'handleWebhook']);

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES  (auth:sanctum required)
// ─────────────────────────────────────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // ── User ─────────────────────────────────────────────────────────────────
    Route::get('/user', [AuthController::class, 'user']);

    // ── Dashboard ────────────────────────────────────────────────────────────
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ── Guest BNB stays (any logged-in user: tenant or normal account) ───────
    Route::get('/my/bnb/bookings',                      [BnbBookingController::class, 'myBookings']);
    Route::get('/my/bnb/bookings/{booking}',             [BnbBookingController::class, 'show']);
    Route::patch('/my/bnb/bookings/{booking}/cancel',    [BnbBookingController::class, 'cancelMine']);
    Route::get('/my/bnb/reviews',                       [BnbReviewController::class, 'myReviews']);
    Route::post('/my/bnb/reviews',                      [BnbReviewController::class, 'store']);

    // ── Messaging (all authenticated users) ──────────────────────────────────
    Route::prefix('messages')->group(function () {
        Route::get('/',                          [MessageController::class, 'conversations']);
        Route::post('/',                         [MessageController::class, 'send']);
        Route::post('/upload',                   [MessageController::class, 'upload']);
        Route::post('/mark-read',                [MessageController::class, 'markAsRead']);
        Route::get('/unread-count',              [MessageController::class, 'unreadCount']);
        Route::get('/search-users',              [MessageController::class, 'searchUsers']);
        Route::get('/online-users',              [MessageController::class, 'getOnlineUsers']);
        Route::get('/all-users',                 [MessageController::class, 'getAllUsers']);
        Route::post('/property/{propertyId}',    [MessageController::class, 'startPropertyConversation']);
        Route::get('/{userId}',                  [MessageController::class, 'messages']);
        Route::patch('/{messageId}',             [MessageController::class, 'edit']);
        Route::delete('/{messageId}',            [MessageController::class, 'delete']);
    });

    // ── Properties (authenticated listing + save) ─────────────────────────────
    // NOTE: /properties/saved MUST come before /properties/{property} so Laravel
    //       does not treat the literal string "saved" as a route-model binding ID.
    Route::get('/properties/saved',              [PropertyController::class, 'saved']);
    Route::get('/properties',                    [PropertyController::class, 'index']);
    Route::get('/properties/{property}',         [PropertyController::class, 'show']);
    Route::post('/properties/{property}/save',   [PropertyController::class, 'save']);
    Route::delete('/properties/{property}/save', [PropertyController::class, 'unsave']);

    // ── Applications (shared) ─────────────────────────────────────────────────
    Route::get('/applications',                              [TenantController::class, 'index']);
    Route::post('/applications',                             [ApplicationController::class, 'store']);
    Route::get('/applications/{application}',                [TenantController::class, 'show']);
    Route::patch('/applications/{application}',              [TenantController::class, 'update']);
    Route::delete('/applications/{application}',             [TenantController::class, 'destroy']);
    Route::get('/applications/application-status',           [TenantController::class, 'applicationStatus']);
    Route::post('/tenant/applications/notify-approval',      [TenantController::class, 'notifyApproval']);

    // ── Shared landlord + agent property management ───────────────────────────
    Route::middleware('role:landlord,agent')->group(function () {
        Route::get('/my-properties',                   [PropertyController::class, 'myProperties']);
        Route::post('/properties',                     [PropertyController::class, 'store']);
        Route::put('/properties/{property}',           [PropertyController::class, 'update']);
        Route::delete('/properties/{property}',        [PropertyController::class, 'destroy']);
        Route::get('/properties/{property}/analytics', [PropertyController::class, 'analytics']);
    });

    // ── Tenant routes ─────────────────────────────────────────────────────────
    Route::middleware('role:tenant')->group(function () {
        Route::get('/tenant/dashboard', [TenantController::class, 'getDashboard']);

        // Saved Properties
        Route::get('/tenant/saved-properties',              [TenantController::class, 'getSavedProperties']);
        Route::post('/tenant/properties/{property}/save',   [TenantController::class, 'saveProperty']);
        Route::delete('/tenant/properties/{property}/save', [TenantController::class, 'unsaveProperty']);

        // Applications
        Route::get('/tenant/applications',                                          [TenantController::class, 'getApplications']);
        Route::post('/tenant/applications',                                         [TenantController::class, 'createApplication']);
        Route::post('/tenant/site-visit/pay',                                      [TenantController::class, 'initiateSiteVisitPayment']);
        Route::get('/tenant/site-visit/status/{orderId}',                           [TenantController::class, 'checkSiteVisitPaymentStatus']);
        Route::post('/tenant/rent/pay',                                             [TenantController::class, 'initiateRentPayment']);
        Route::post('/tenant/rent/additional-months',                               [TenantController::class, 'createAdditionalMonthsPayment']);
        Route::get('/tenant/rent/properties',                                       [TenantController::class, 'getRentableProperties']);
        Route::get('/tenant/rent/status/{orderId}',                                  [TenantController::class, 'checkRentPaymentStatus']);
        Route::put('/tenant/applications/{application}/payment-status',             [TenantController::class, 'updateApplicationPaymentStatus']);

        // Payments (Selcom)
        Route::post('/payment/selcom/mobile-money', [PaymentController::class, 'initiateMobileMoney']);

        // Contracts
        Route::get('/tenant/contract',                             [TenantController::class, 'getMyContract']);
        Route::post('/tenant/contract',                            [TenantController::class, 'createContract']);
        Route::get('/tenant/contracts/{contract}/download',        [TenantController::class, 'downloadContract']);

        // Digital Contracts
        Route::get('/tenant/digital-contracts',                         [TenantController::class, 'getDigitalContracts']);
        Route::get('/tenant/digital-contracts/{contract}/download',     [TenantController::class, 'downloadDigitalContract']);
        Route::post('/tenant/digital-contracts/submit',                 [TenantController::class, 'submitDigitalContract']);

        // Payments
        Route::get('/tenant/payments',                           [TenantController::class, 'getMyPayments']);
        Route::get('/tenant/payment-methods',                    [TenantController::class, 'getPaymentMethods']);
        Route::get('/tenant/payment-stats',                      [TenantController::class, 'getPaymentStats']);
        Route::post('/tenant/payments/{payment}/pay',            [TenantController::class, 'makePayment']);
        Route::get('/tenant/payments/{payment}/status',          [TenantController::class, 'checkPaymentStatus']);
        Route::get('/tenant/payment-history',                    [TenantController::class, 'getPaymentHistory']);
        Route::get('/tenant/payment-summary',                    [TenantController::class, 'getPaymentSummary']);
        Route::get('/tenant/payments/{payment}/receipt',         [TenantController::class, 'downloadReceipt']);

        // Notifications
        // NOTE: static /read-all MUST come before /{notification}/... routes
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

        // Rental Workflow
        Route::post('/workflow/apply',                           [RentalWorkflowController::class, 'applyForProperty']);
        Route::get('/workflow/property/{property}/status',       [RentalWorkflowController::class, 'getWorkflowStatus']);
        Route::get('/workflow/pending-payments',                 [RentalWorkflowController::class, 'getPendingPayments']);
        Route::post('/workflow/payment/{payment}/pay-monthly',   [RentalWorkflowController::class, 'payMonthlyRent']);
    });

    // ── Agent routes ──────────────────────────────────────────────────────────
    Route::middleware('role:agent')->group(function () {
        // Dashboard
        Route::get('/agent/dashboard', [AgentController::class, 'getDashboard']);

        // Listings
        Route::get('/agent/my-listings',                   [AgentController::class, 'getMyListings']);
        Route::post('/agent/listings',                     [AgentController::class, 'createListing']);
        Route::put('/agent/listings/{property}',           [AgentController::class, 'updateListing']);
        Route::delete('/agent/listings/{property}',        [AgentController::class, 'deleteListing']);
        Route::get('/agent/listings/{property}/analytics', [AgentController::class, 'getPropertyAnalytics']);
        Route::post('/agent/listings/{property}/share',    [AgentController::class, 'recordShare']);

        // Linked Owners
        Route::get('/agent/linked-owners', [AgentController::class, 'getLinkedOwners']);
        Route::post('/agent/link-owner',   [AgentController::class, 'linkOwner']);

        // Tracking
        Route::get('/agent/tracking',              [AgentController::class, 'getTrackingLinks']);
        Route::post('/agent/track-share',          [AgentController::class, 'trackShare']);
        Route::get('/agent/debug-property/{id}',   [AgentController::class, 'debugProperty']);
        Route::get('/agent/qr-codes/{property}',   [AgentController::class, 'generateQRCode']);

        // Notifications
        Route::get('/notifications/agent',  [AgentController::class, 'getAgentNotifications']);
        Route::post('/notifications/agent', [AgentController::class, 'notifyAgent']);

        // Leads
        Route::get('/agent/leads',      [AgentController::class, 'getLeads']);
        Route::get('/agent/lead-stats', [AgentController::class, 'getLeadStats']);
        Route::post('/agent/leads',     [AgentController::class, 'createLead']);
        Route::patch('/agent/leads/{lead}', [AgentController::class, 'updateLeadStatus']);

        // Applications
        Route::get('/agent/applications',                      [AgentController::class, 'getApplications']);
        Route::patch('/agent/applications/{application}/approve', [AgentController::class, 'approveApplication']);
        Route::patch('/agent/applications/{application}/reject',  [AgentController::class, 'rejectApplication']);

        // Commissions
        Route::get('/agent/my-commissions',   [AgentController::class, 'getMyCommissions']);
        Route::get('/agent/commission-stats', [AgentController::class, 'getCommissionStats']);
        Route::get('/agent/payouts',          [AgentController::class, 'getPayoutHistory']);

        // Rent payments on agent-linked properties
        Route::get('/agent/rent-payments',       [AgentController::class, 'getRentPayments']);
        Route::get('/agent/rent-payment-stats',  [AgentController::class, 'getRentPaymentStats']);

        // Analytics
        Route::get('/agent/analytics', [AgentController::class, 'getAnalytics']);

        // Messages
        Route::get('/agent/messages',  [AgentController::class, 'getMessages']);
        Route::post('/agent/messages', [AgentController::class, 'sendMessage']);
    });

    // ── Commercial routes ────────────────────────────────────────────────────
    Route::middleware('role:commercial')->group(function () {
        // Dashboard
        Route::get('/commercial/dashboard', [CommercialController::class, 'dashboard']);

        // Amenities
        Route::get('/commercial/amenities', [CommercialPropertyController::class, 'getAmenities']);
        
        // Property collection & creation
        Route::get('/commercial/properties', [CommercialPropertyController::class, 'index']);
        Route::post('/commercial/properties', [CommercialPropertyController::class, 'store']);
        
        // Parameterised property routes
        // (static routes BEFORE parameterised /{id} routes)
        Route::get('/commercial/properties/{id}', [CommercialPropertyController::class, 'show']);
        Route::post('/commercial/properties/{id}', [CommercialPropertyController::class, 'update']);   // POST because EditProperty sends FormData
        Route::put('/commercial/properties/{id}', [CommercialPropertyController::class, 'update']);   // also accept PUT for API clients
        Route::delete('/commercial/properties/{id}', [CommercialPropertyController::class, 'destroy']);
        Route::patch('/commercial/properties/{id}/toggle-status', [CommercialPropertyController::class, 'toggleStatus']);
        Route::get('/commercial/properties/{id}/analytics', [CommercialPropertyController::class, 'analytics']);
        
        // Image management
        
        Route::post('/commercial/properties/{id}/images', [CommercialPropertyController::class, 'uploadImages']);
        Route::delete('/commercial/properties/{propertyId}/images/{imageId}', [CommercialPropertyController::class, 'deleteImage']);
        Route::patch('/commercial/properties/{propertyId}/images/{imageId}/primary', [CommercialPropertyController::class, 'setPrimaryImage']);
        
        // Applications
        Route::get('/commercial/applications', [ApplicationController::class, 'getCommercialApplications']);
        Route::patch('/commercial/applications/{application}/approve', [ApplicationController::class, 'approveCommercialApplication']);
        Route::patch('/commercial/applications/{application}/reject', [ApplicationController::class, 'rejectCommercialApplication']);
        
        // Payments, Analytics, Reports, Notifications, Profile, Settings
        Route::get('/commercial/payments', [CommercialController::class, 'payments']);
        Route::get('/commercial/analytics', [CommercialController::class, 'analytics']);
        Route::get('/commercial/reports', [CommercialController::class, 'reports']);
        Route::post('/commercial/reports', [CommercialController::class, 'generateReport']);
        Route::post('/commercial/reports/generate', [CommercialController::class, 'generateReport']);
        Route::get('/commercial/reports/{id}/download', [CommercialController::class, 'downloadReport']);

        Route::get('/commercial/notifications', [CommercialController::class, 'notifications']);
        Route::get('/commercial/notification-stats', [CommercialController::class, 'notificationStats']);
        Route::patch('/commercial/notifications/read-all', [CommercialController::class, 'markAllNotificationsRead']);
        Route::patch('/commercial/notifications/{notification}/read', [CommercialController::class, 'markNotificationRead']);

        Route::get('/commercial/profile', [CommercialController::class, 'profile']);
        Route::put('/commercial/profile', [CommercialController::class, 'updateProfile']);
        Route::get('/commercial/settings', [DashboardController::class, 'getCommercialSettings']);
        Route::put('/commercial/settings', [DashboardController::class, 'updateCommercialSettings']);
    });

    // ── Owner (landlord) routes ───────────────────────────────────────
    Route::middleware('role:landlord')->group(function () {
        Route::get('/owner/dashboard', [OwnerController::class, 'getDashboard']);

        // Properties Management
        Route::get('/owner/my-properties',                   [OwnerController::class, 'getMyProperties']);
        Route::post('/owner/properties',                     [OwnerController::class, 'createProperty']);
        Route::put('/owner/properties/{property}',           [OwnerController::class, 'updateProperty']);
        Route::delete('/owner/properties/{property}',        [OwnerController::class, 'deleteProperty']);
        Route::get('/owner/properties/{property}/analytics', [OwnerController::class, 'getPropertyAnalytics']);

        // Applications Management
        Route::get('/owner/applications',                             [OwnerController::class, 'getApplications']);
        Route::patch('/owner/applications/{application}/approve',     [OwnerController::class, 'approveApplication']);
        Route::patch('/owner/applications/{application}/reject',      [OwnerController::class, 'rejectApplication']);

        // Tenants
        Route::get('/owner/tenants',                        [OwnerController::class, 'getMyTenants']);
        Route::post('/owner/tenants/create-from-approved',  [OwnerController::class, 'createTenantFromApprovedApplication']);

        // Contracts
        Route::get('/owner/contracts',  [OwnerController::class, 'getContracts']);
        Route::post('/owner/contracts', [OwnerController::class, 'createContract']);

        // Digital Contracts
        // NOTE: static routes /upload-file and /generate MUST come before /{contract}/...
        Route::get('/owner/digital-contracts',                              [OwnerController::class, 'getDigitalContracts']);
        Route::post('/owner/digital-contracts',                             [OwnerController::class, 'createDigitalContract']);
        Route::post('/owner/digital-contracts/upload-file',                 [OwnerController::class, 'uploadContractFile']);
        Route::post('/owner/digital-contracts/generate',                    [OwnerController::class, 'generateDigitalContract']);
        Route::put('/owner/digital-contracts/{contract}/send',              [OwnerController::class, 'sendContractToTenant']);
        Route::put('/owner/digital-contracts/{contract}/approve',           [OwnerController::class, 'approveSignedContract']);
        Route::get('/owner/digital-contracts/{contract}/download',          [OwnerController::class, 'downloadDigitalContract']);

        // Rent Collection
        Route::get('/owner/rent-collection',       [OwnerController::class, 'getRentCollection']);
        Route::get('/owner/rent-collection-stats', [OwnerController::class, 'getRentCollectionStats']);

        // Payment Receipts
        Route::get('/owner/receipts',                    [OwnerController::class, 'getReceipts']);
        Route::get('/owner/receipts/{payment}/download', [OwnerController::class, 'downloadReceipt']);

        // Commission Reports
        Route::get('/owner/commission-reports', [OwnerController::class, 'getCommissionReports']);

        // Analytics
        Route::get('/owner/analytics', [OwnerController::class, 'getAnalytics']);

        // Messages
        Route::get('/owner/messages',  [OwnerController::class, 'getMessages']);
        Route::post('/owner/messages', [OwnerController::class, 'sendMessage']);

        // Rental Workflow (Owner)
        Route::get('/workflow/property/{property}/applications',       [RentalWorkflowController::class, 'getApplicationsForProperty']);
        Route::post('/workflow/application/{application}/approve',     [RentalWorkflowController::class, 'approveApplication']);
        Route::post('/workflow/application/{application}/reject',      [RentalWorkflowController::class, 'rejectApplication']);
    });

    // ── Admin routes ──────────────────────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        // Users
        Route::get('/admin/users',                 [AdminController::class, 'getUsers']);
        Route::get('/admin/users/stats',           [AdminController::class, 'getUserStats']);
        Route::get('/admin/users/active-sessions', [AdminController::class, 'getActiveSessions']);
        Route::get('/admin/users/{user}/activity', [AdminController::class, 'getUserActivity']);
        Route::get('/admin/activity-logs',        [AdminController::class, 'getActivityLogs']);
        Route::post('/admin/users',                [AdminController::class, 'createUser']);
        Route::put('/admin/users/{user}',          [AdminController::class, 'updateUser']);
        Route::delete('/admin/users/{user}',       [AdminController::class, 'deleteUser']);
        Route::patch('/admin/users/{user}/status', [AdminController::class, 'updateUserStatus']);

        // Properties
        // NOTE: /stats MUST come before /{property} to avoid binding "stats" as an ID
        Route::get('/admin/properties/stats',              [AdminController::class, 'getPropertyStats']);
        Route::get('/admin/properties',                    [AdminController::class, 'getProperties']);
        Route::post('/admin/properties',                   [AdminController::class, 'createProperty']);
        Route::post('/admin/properties/upload-images',     [AdminController::class, 'uploadImages']);
        Route::put('/admin/properties/{property}',         [AdminController::class, 'updateProperty']);
        Route::delete('/admin/properties/{property}',      [AdminController::class, 'deleteProperty']);

        // Transactions
        // NOTE: /stats MUST come before /{transaction}/...
        Route::get('/admin/transactions/stats',                        [AdminController::class, 'getTransactionStats']);
        Route::get('/admin/transactions',                              [AdminController::class, 'getTransactions']);
        Route::patch('/admin/transactions/{transaction}/status',       [AdminController::class, 'updateTransactionStatus']);
        Route::delete('/admin/transactions/{transaction}',             [AdminController::class, 'deleteTransaction']);

        // Contracts
        // NOTE: /stats MUST come before /{contract}/...
        Route::get('/admin/contracts/stats', [AdminController::class, 'getContractStats']);
        Route::get('/admin/contracts',       [AdminController::class, 'getContracts']);

        // Commission Control
        Route::get('/admin/commission/rules',                            [AdminController::class, 'getCommissionRules']);
        Route::get('/admin/commission/payments',                         [AdminController::class, 'getCommissionPayments']);
        Route::get('/admin/commission/stats',                            [AdminController::class, 'getCommissionStats']);
        Route::patch('/admin/commission/payments/{commission}/status',   [AdminController::class, 'updateCommissionPaymentStatus']);

        // System Settings
        Route::get('/admin/settings', [AdminController::class, 'getSettings']);
        Route::put('/admin/settings', [AdminController::class, 'updateSettings']);

        // Verification
        Route::get('/admin/verification/requests', [AdminController::class, 'getVerificationRequests']);
        Route::get('/admin/verification/stats',    [AdminController::class, 'getVerificationStats']);
        Route::patch('/admin/verification/requests/{userId}/status', [AdminController::class, 'updateVerificationStatus']);

        // Alerts
        Route::get('/admin/alerts',       [AdminController::class, 'getAlerts']);
        Route::get('/admin/alerts/stats', [AdminController::class, 'getAlertStats']);

        // BNB Management
        Route::get('/admin/bnb/properties',                          [AdminController::class, 'getAdminBnbProperties']);
        Route::patch('/admin/bnb/properties/{property}/status',      [AdminController::class, 'updateAdminBnbPropertyStatus']);
        Route::get('/admin/bnb/bookings',                            [AdminController::class, 'getAdminBnbBookings']);
        Route::get('/admin/bnb/analytics',                           [AdminController::class, 'getAdminBnbAnalytics']);

        // Payments
        Route::get('/admin/payments/stats', [AdminController::class, 'getAdminPaymentStats']);
        Route::get('/admin/payments',       [AdminController::class, 'getAdminPayments']);
    });

    // ── BNB Owner routes ──────────────────────────────────────────────────────
    Route::middleware('role:bnb_owner')->group(function () {
        // Properties
        Route::get('/bnb/properties',               [BnbPropertyController::class, 'index']);
        Route::post('/bnb/properties',              [BnbPropertyController::class, 'store']);
        Route::get('/bnb/properties/{property}',    [BnbPropertyController::class, 'show']);
        Route::put('/bnb/properties/{property}',    [BnbPropertyController::class, 'update']);
        Route::delete('/bnb/properties/{property}', [BnbPropertyController::class, 'destroy']);
        Route::get('/bnb/analytics',                [BnbPropertyController::class, 'analytics']);

        // Bookings
        Route::get('/bnb/bookings',                      [BnbBookingController::class, 'index']);
        Route::get('/bnb/bookings/{booking}',             [BnbBookingController::class, 'show']);
        Route::patch('/bnb/bookings/{booking}/status',    [BnbBookingController::class, 'updateStatus']);

        // Reviews
        Route::get('/bnb/reviews',                          [BnbReviewController::class, 'index']);
        Route::get('/bnb/reviews/{review}',                 [BnbReviewController::class, 'show']);
        Route::post('/bnb/reviews/{review}/respond',        [BnbReviewController::class, 'respond']);
        Route::post('/bnb/reviews/{review}/helpful',        [BnbReviewController::class, 'markHelpful']);
        Route::get('/bnb/reviews/property/{propertyId}',    [BnbReviewController::class, 'propertyReviews']);
        Route::get('/bnb/reviews/analytics',                [BnbReviewController::class, 'analytics']);

        // Image Upload
        Route::post('/upload-image',    [ImageUploadController::class, 'upload']);
        Route::post('/upload-images',   [ImageUploadController::class, 'uploadMultiple']);
        Route::delete('/delete-image',  [ImageUploadController::class, 'delete']);
    });

    // ── Payment webhook ───────────────────────────────────────────────────────
    // Route::post('/payment/webhook', [PaymentWebhookController::class, 'handleSelcomWebhook']);

});