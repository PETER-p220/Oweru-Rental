/// API Configuration
/// Centralized place to manage all API endpoints and URLs
/// Similar to the frontend .env configuration
library;

class ApiConfig {
  // For Android emulators, use 10.0.2.2 to access host machine
  // For iOS simulator & physical devices, use localhost
  // For network access (emulator + physical devices), use IP: 192.168.1.200
  // For development: http://192.168.1.200:8000
  // For production: https://rental.oweru.com
  static const String baseUrl = 'https://rental.oweru.com';

  // API endpoints
  static const String apiPath = '$baseUrl/api';

  // Common endpoints
  static const String tenantDashboard = '$apiPath/tenant/dashboard';
  static const String landlordDashboard = '$apiPath/owner/dashboard';
  static const String agentDashboard = '$apiPath/agent/dashboard';

  // Landlord/Owner endpoints
  static const String landlordMyProperties = '$apiPath/owner/my-properties';
  static const String landlordCreateProperty = '$apiPath/owner/properties';
  static const String landlordUpdateProperty = '$apiPath/owner/properties/{property}';
  static const String landlordDeleteProperty = '$apiPath/owner/properties/{property}';
  static const String landlordPropertyAnalytics = '$apiPath/owner/properties/{property}/analytics';
  static const String landlordApplications = '$apiPath/owner/applications';
  static const String landlordApproveApplication = '$apiPath/owner/applications/{application}/approve';
  static const String landlordRejectApplication = '$apiPath/owner/applications/{application}/reject';
  static const String landlordTenants = '$apiPath/owner/tenants';
  static const String landlordCreateTenant = '$apiPath/owner/tenants/create-from-approved';
  static const String landlordContracts = '$apiPath/owner/contracts';
  static const String landlordCreateContract = '$apiPath/owner/contracts';
  static const String landlordDigitalContracts = '$apiPath/owner/digital-contracts';
  static const String landlordCreateDigitalContract = '$apiPath/owner/digital-contracts';
  static const String landlordUploadContractFile = '$apiPath/owner/digital-contracts/upload-file';
  static const String landlordGenerateContract = '$apiPath/owner/digital-contracts/generate';
  static const String landlordSendContract = '$apiPath/owner/digital-contracts/{contract}/send';
  static const String landlordApproveContract = '$apiPath/owner/digital-contracts/{contract}/approve';
  static const String landlordDownloadContract = '$apiPath/owner/digital-contracts/{contract}/download';
  static const String landlordRentCollection = '$apiPath/owner/rent-collection';
  static const String landlordRentCollectionStats = '$apiPath/owner/rent-collection-stats';
  static const String landlordReceipts = '$apiPath/owner/receipts';
  static const String landlordDownloadReceipt = '$apiPath/owner/receipts/{payment}/download';
  static const String landlordCommissionReports = '$apiPath/owner/commission-reports';
  static const String landlordAnalytics = '$apiPath/owner/analytics';
  static const String landlordMessages = '$apiPath/owner/messages';
  static const String landlordSendMessage = '$apiPath/owner/messages';

  // Auth endpoints
  static const String login = '$apiPath/login';
  static const String logout = '$apiPath/logout';
  static const String register = '$apiPath/register';

  /// Get API base URL based on environment
  /// You can extend this to support multiple environments
  static String getBaseUrl({String environment = 'development'}) {
    switch (environment) {
      case 'production':
        return 'https://rental.oweru.com';
      case 'staging':
        return 'https://staging.oweru.com';
      case 'development':
      default:
        return 'https://rental.oweru.com';
    }
  }
}
