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

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Public property routes (no authentication required)
Route::get('/public/properties', [PropertyController::class, 'publicIndex']);
Route::get('/public/properties/{property}', [PropertyController::class, 'publicShow']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // User
    Route::get('/user', [AuthController::class, 'user']);
    
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    
    // Properties
    Route::get('/properties', [PropertyController::class, 'index']);
    Route::get('/properties/{property}', [PropertyController::class, 'show']);
    Route::post('/properties/{property}/save', [PropertyController::class, 'save']);
    Route::delete('/properties/{property}/save', [PropertyController::class, 'unsave']);
    Route::get('/properties/saved', [PropertyController::class, 'saved']);
    
    // Applications
    Route::post('/applications', [ApplicationController::class, 'store']);
    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::get('/applications/{application}', [ApplicationController::class, 'show']);
    Route::put('/applications/{application}', [ApplicationController::class, 'update']);
    
    // Owner specific routes
    Route::middleware('role:landlord,agent')->group(function () {
        Route::get('/my-properties', [PropertyController::class, 'myProperties']);
        Route::post('/properties', [PropertyController::class, 'store']);
        Route::put('/properties/{property}', [PropertyController::class, 'update']);
        Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);
        Route::get('/properties/{property}/analytics', [PropertyController::class, 'analytics']);
    });
    
    // Agent specific routes
    Route::middleware('role:agent')->group(function () {
        Route::get('/commissions', [DashboardController::class, 'commissions']);
        Route::get('/leads', [DashboardController::class, 'leads']);
    });
    
    // Tenant specific routes
    Route::middleware('role:tenant')->group(function () {
        // Tenant Dashboard
        Route::get('/tenant/dashboard', [TenantController::class, 'getDashboard']);
        
        // Saved Properties
        Route::get('/tenant/saved-properties', [TenantController::class, 'getSavedProperties']);
        Route::post('/tenant/properties/{property}/save', [TenantController::class, 'saveProperty']);
        Route::delete('/tenant/properties/{property}/save', [TenantController::class, 'unsaveProperty']);
        
        // Applications
        Route::get('/tenant/applications', [TenantController::class, 'getApplications']);
        Route::post('/tenant/applications', [TenantController::class, 'createApplication']);
        
        // Contracts
        Route::get('/tenant/contract', [TenantController::class, 'getMyContract']);
        Route::get('/tenant/contracts/{contract}/download', [TenantController::class, 'downloadContract']);
        
        // Payments
        Route::get('/tenant/payments', [TenantController::class, 'getMyPayments']);
        Route::get('/tenant/payment-methods', [TenantController::class, 'getPaymentMethods']);
        Route::get('/tenant/payment-stats', [TenantController::class, 'getPaymentStats']);
        Route::post('/tenant/payments/{payment}/pay', [TenantController::class, 'makePayment']);
        Route::get('/tenant/payment-history', [TenantController::class, 'getPaymentHistory']);
        Route::get('/tenant/payment-summary', [TenantController::class, 'getPaymentSummary']);
        Route::get('/tenant/payments/{payment}/receipt', [TenantController::class, 'downloadReceipt']);
        
        // Notifications
        Route::get('/tenant/notifications', [TenantController::class, 'getNotifications']);
        Route::get('/tenant/notification-stats', [TenantController::class, 'getNotificationStats']);
        Route::patch('/tenant/notifications/{notification}/read', [TenantController::class, 'markNotificationAsRead']);
        Route::patch('/tenant/notifications/read-all', [TenantController::class, 'markAllNotificationsAsRead']);
        Route::patch('/tenant/notifications/{notification}/archive', [TenantController::class, 'archiveNotification']);
        Route::delete('/tenant/notifications/{notification}', [TenantController::class, 'deleteNotification']);
        
        // Analytics
        Route::get('/tenant/analytics', [TenantController::class, 'getAnalytics']);
    });
    
    // Agent specific routes (expanded)
    Route::middleware('role:agent')->group(function () {
        // Agent Dashboard
        Route::get('/agent/dashboard', [AgentController::class, 'getDashboard']);
        
        // Listings
        Route::get('/agent/my-listings', [AgentController::class, 'getMyListings']);
        Route::post('/agent/listings', [AgentController::class, 'createListing']);
        Route::put('/agent/listings/{property}', [AgentController::class, 'updateListing']);
        Route::delete('/agent/listings/{property}', [AgentController::class, 'deleteListing']);
        Route::get('/agent/listings/{property}/analytics', [AgentController::class, 'getPropertyAnalytics']);
        
        // Linked Owners
        Route::get('/agent/linked-owners', [AgentController::class, 'getLinkedOwners']);
        Route::post('/agent/link-owner', [AgentController::class, 'linkOwner']);
        
        // Tracking and Sharing
        Route::get('/agent/tracking', [AgentController::class, 'getTrackingLinks']);
        Route::get('/agent/qr-codes/{property}', [AgentController::class, 'generateQRCode']);
        
        // Leads and Visitors
        Route::get('/agent/leads', [AgentController::class, 'getLeads']);
        Route::get('/agent/lead-stats', [AgentController::class, 'getLeadStats']);
        
        // Applications
        Route::get('/agent/applications', [AgentController::class, 'getApplications']);
        
        // Commissions
        Route::get('/agent/my-commissions', [AgentController::class, 'getMyCommissions']);
        Route::get('/agent/commission-stats', [AgentController::class, 'getCommissionStats']);
        Route::get('/agent/payouts', [AgentController::class, 'getPayoutHistory']);
        
        // Analytics
        Route::get('/agent/analytics', [AgentController::class, 'getAnalytics']);
    });
    
    // Owner specific routes (expanded)
    Route::middleware('role:landlord')->group(function () {
        // Owner Dashboard
        Route::get('/owner/dashboard', [OwnerController::class, 'getDashboard']);
        
        // Properties Management
        Route::get('/owner/my-properties', [OwnerController::class, 'getMyProperties']);
        Route::post('/owner/properties', [OwnerController::class, 'createProperty']);
        Route::put('/owner/properties/{property}', [OwnerController::class, 'updateProperty']);
        Route::delete('/owner/properties/{property}', [OwnerController::class, 'deleteProperty']);
        Route::get('/owner/properties/{property}/analytics', [OwnerController::class, 'getPropertyAnalytics']);
        
        // Applications Management
        Route::get('/owner/applications', [OwnerController::class, 'getApplications']);
        Route::patch('/owner/applications/{application}/approve', [OwnerController::class, 'approveApplication']);
        Route::patch('/owner/applications/{application}/reject', [OwnerController::class, 'rejectApplication']);
        
        // Tenants Management
        Route::get('/owner/tenants', [OwnerController::class, 'getMyTenants']);
        
        // Contracts Management
        Route::get('/owner/contracts', [OwnerController::class, 'getContracts']);
        Route::post('/owner/contracts', [OwnerController::class, 'createContract']);
        
        // Rent Collection
        Route::get('/owner/rent-collection', [OwnerController::class, 'getRentCollection']);
        Route::get('/owner/rent-collection-stats', [OwnerController::class, 'getRentCollectionStats']);
        
        // Payment Receipts
        Route::get('/owner/receipts', [OwnerController::class, 'getReceipts']);
        Route::get('/owner/receipts/{payment}/download', [OwnerController::class, 'downloadReceipt']);
        
        // Commission Reports
        Route::get('/owner/commission-reports', [OwnerController::class, 'getCommissionReports']);
        
        // Analytics
        Route::get('/owner/analytics', [OwnerController::class, 'getAnalytics']);

        // Messages
        Route::get('/owner/messages', [OwnerController::class, 'getMessages']);
        Route::post('/owner/messages', [OwnerController::class, 'sendMessage']);
    });
    
    // Admin specific routes
    Route::middleware('role:admin')->group(function () {
        // Users Management
        Route::get('/admin/users', [AdminController::class, 'getUsers']);
        Route::get('/admin/users/stats', [AdminController::class, 'getUserStats']);
        Route::post('/admin/users', [AdminController::class, 'createUser']);
        Route::put('/admin/users/{user}', [AdminController::class, 'updateUser']);
        Route::delete('/admin/users/{user}', [AdminController::class, 'deleteUser']);
        Route::patch('/admin/users/{user}/status', [AdminController::class, 'updateUserStatus']);
        
        // Properties Management
        Route::get('/admin/properties', [AdminController::class, 'getProperties']);
        Route::get('/admin/properties/stats', [AdminController::class, 'getPropertyStats']);
        
        // Transactions Management
        Route::get('/admin/transactions', [AdminController::class, 'getTransactions']);
        Route::get('/admin/transactions/stats', [AdminController::class, 'getTransactionStats']);
        
        // Commission Control
        Route::get('/admin/commission/rules', [AdminController::class, 'getCommissionRules']);
        Route::get('/admin/commission/payments', [AdminController::class, 'getCommissionPayments']);
        Route::get('/admin/commission/stats', [AdminController::class, 'getCommissionStats']);
        
        // System Settings
        Route::get('/admin/settings', [AdminController::class, 'getSettings']);
        Route::put('/admin/settings', [AdminController::class, 'updateSettings']);
        
        // Verification Management
        Route::get('/admin/verification/requests', [AdminController::class, 'getVerificationRequests']);
        Route::get('/admin/verification/stats', [AdminController::class, 'getVerificationStats']);
        
        // Alerts Management
        Route::get('/admin/alerts', [AdminController::class, 'getAlerts']);
        Route::get('/admin/alerts/stats', [AdminController::class, 'getAlertStats']);
    });
});
