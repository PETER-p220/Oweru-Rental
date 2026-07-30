import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import GoogleCallback from './pages/GoogleCallback';
import AuthError from './pages/AuthError';
import TenantDashboard from './pages/TenantDashboard';
import LandlordDashboard from './pages/LandlordDashboard';
import SettingsPage from './pages/Settings';
import DashboardLayout, { type UserRole } from './components/DashboardLayout';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RouteGuard from './components/RouteGuard';

// Tenant pages
import Payments from './pages/tenant/Payments';
import PaymentHistory from './pages/tenant/PaymentHistory';
import Notifications from './pages/tenant/Notifications';
import Messages from './pages/tenant/Messages';
import SavedProperties from './pages/tenant/SavedProperties';
import TenantApplicationsPage from './pages/tenant/ApplicationsPage';
import ApplicationStatus from './pages/tenant/ApplicationStatus';
import TenantDigitalContractPage from './pages/tenant/DigitalContractPage';
import MyBnbStays from './pages/tenant/MyBnbStays';
import BnbPropertyDetail from './pages/bnb/BnbPropertyDetail';
import BnbPaymentReturn from './pages/bnb/BnbPaymentReturn';
import BrowseBnbStays from './pages/bnb/BrowseBnbStays';
import { BnbPaymentReturnPublicRedirect } from './pages/bnb/BnbPublicRedirect';
import TenantAnalyticsPage from './pages/tenant/AnalyticsPage';

// Landlord pages
import MyProperties from './pages/landlord/MyProperties';
import MyTenants from './pages/landlord/MyTenants';
import AddProperty from './pages/landlord/AddProperty';
import EditLandlordProperty from './pages/landlord/EditLandlordProperty';
import EditPropertySimple from './pages/landlord/EditPropertySimple';
import ApplicationsPage from './pages/landlord/ApplicationsPage';
import DigitalContractPage from './pages/landlord/DigitalContractPage';
import RentCollectionPage from './pages/landlord/RentCollectionPage';
import ReceiptsPage from './pages/landlord/ReceiptsPage';
import LandlordAnalyticsPage from './pages/landlord/AnalyticsPage';
import LandlordMessagesPage from './pages/landlord/MessagesPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import PropertiesManagement from './pages/admin/PropertiesManagement';
import OweruProperties from './pages/admin/OweruProperties';
import TransactionsManagement from './pages/admin/TransactionsManagement';
import CommissionControl from './pages/admin/CommissionControl';
import PaymentsManagement from './pages/admin/PaymentsManagement';
import ContractsManagement from './pages/admin/ContractsManagement';
import VerificationManagement from './pages/admin/VerificationManagement';
import AlertsManagement from './pages/admin/AlertsManagement';
import ActivityLogs from './pages/admin/ActivityLogs';
import SystemSettings from './pages/admin/SystemSettings';

// BNB Owner pages
import BnbDashboard from './pages/bnb/BnbDashboard';
import BnbProperties from './pages/bnb/BnbProperties';
import BnbBookings from './pages/bnb/BnbBookings';
import BnbReviews from './pages/bnb/BnbReviews';
import BnbAnalytics from './pages/bnb/BnbAnalytics';
import BnbMessages from './pages/bnb/BnbMessages';

// Agent pages
import AgentDashboard from './pages/agent/AgentDashboard';
import MyListings from './pages/agent/MyListings';
import AddListing from './pages/agent/AddListing';
import LinkedOwners from './pages/agent/LinkedOwners';
import QRCodes from './pages/agent/QRCodes';
import ShareAndTrack from './pages/agent/ShareAndTrack';
import PayoutHistory from './pages/agent/PayoutHistory';
import LeadsAndVisitors from './pages/agent/LeadsAndVisitors';
import MyCommissions from './pages/agent/MyCommissions';
import AgentRentPayments from './pages/agent/RentPayments';
import AgentApplicationsPage from './pages/agent/ApplicationsPage';
import AgentAnalyticsPage from './pages/agent/AnalyticsPage';
import AgentMessagesPage from './pages/agent/MessagesPage';

// Commercial pages
import CommercialDashboard from './pages/commercial/Dashboard';
import CommercialProperties from './pages/commercial/Properties';
import CommercialAddProperty from './pages/commercial/AddProperty';
import CommercialEditProperty from './pages/commercial/EditProperty';
import CommercialApplications from './pages/commercial/Applications';
import CommercialAnalytics from './pages/commercial/Analytics';
import CommercialReports from './pages/commercial/Reports';
import CommercialProfile from './pages/commercial/Profile';
import CommercialPayments from './pages/commercial/Payments';
import CommercialNotifications from './pages/commercial/Notifications';

// ─────────────────────────────────────────────
// Public routes  (Header + Footer)
// ─────────────────────────────────────────────
const PublicRoutes = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/bnb/payment/return" element={<BnbPaymentReturnPublicRedirect />} />
        <Route path="/bnb/:id" element={<BnbPropertyDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/auth/error" element={<AuthError />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

// Tenant routes
const TenantRoutes = () => (
  <RouteGuard requiredRole="tenant">
    <DashboardLayout title="Dashboard">
      <Routes>
        <Route path="" element={<TenantDashboard />} />
        <Route path="properties" element={<Properties />} />
        <Route path="applications" element={<TenantApplicationsPage />} />
        <Route path="application-status" element={<ApplicationStatus />} />
        <Route path="digital-contracts" element={<TenantDigitalContractPage />} />
        <Route path="analytics" element={<TenantAnalyticsPage />} />
        <Route path="saved-properties" element={<SavedProperties />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="payments" element={<Payments />} />
        <Route path="payment-history" element={<PaymentHistory />} />
        <Route path="browse-bnb-stays" element={<BrowseBnbStays />} />
        <Route path="bnb-property/:id" element={<BnbPropertyDetail />} />
        <Route path="bnb-payment-return" element={<BnbPaymentReturn />} />
        <Route path="bnb-stays" element={<MyBnbStays />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="messages" element={<Messages />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  </RouteGuard>
);

// Landlord routes
const LandlordRoutes = () => (
  <RouteGuard requiredRole="landlord">
    <DashboardLayout title="Dashboard">
      <Routes>
        <Route path="" element={<LandlordDashboard />} />
        <Route path="my-properties" element={<MyProperties />} />
        <Route path="add-property" element={<AddProperty />} />
        <Route path="properties/:id/edit" element={<EditLandlordProperty />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="digital-contracts" element={<DigitalContractPage />} />
        <Route path="tenants" element={<MyTenants />} />
        <Route path="rent-collection" element={<RentCollectionPage />} />
        <Route path="receipts" element={<ReceiptsPage />} />
        <Route path="analytics" element={<LandlordAnalyticsPage />} />
        <Route path="messages" element={<LandlordMessagesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="test-edit" element={<EditPropertySimple />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  </RouteGuard>
);

// Agent routes
const AgentRoutes = () => (
  <RouteGuard requiredRole="agent">
    <DashboardLayout title="Dashboard">
      <Routes>
        <Route path="" element={<AgentDashboard />} />
        <Route path="my-listings" element={<MyListings />} />
        <Route path="listings/add" element={<AddListing />} />
        <Route path="linked-owners" element={<LinkedOwners />} />
        <Route path="applications" element={<AgentApplicationsPage />} />
        <Route path="analytics" element={<AgentAnalyticsPage />} />
        <Route path="messages" element={<AgentMessagesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="qr-codes" element={<QRCodes />} />
        <Route path="qr-codes/:id" element={<QRCodes />} />
        <Route path="tracking" element={<ShareAndTrack />} />
        <Route path="payouts" element={<PayoutHistory />} />
        <Route path="leads" element={<LeadsAndVisitors />} />
        <Route path="commissions" element={<MyCommissions />} />
        <Route path="rent-payments" element={<AgentRentPayments />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  </RouteGuard>
);

// Admin routes
const AdminRoutes = () => (
  <RouteGuard requiredRole="admin">
    <DashboardLayout title="Dashboard">
      <Routes>
        <Route path="" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="properties" element={<PropertiesManagement />} />
        <Route path="oweru-properties" element={<OweruProperties />} />
        <Route path="add-oweru-property" element={<AddProperty />} />
        <Route path="transactions" element={<TransactionsManagement />} />
        <Route path="commission" element={<CommissionControl />} />
        <Route path="payments" element={<PaymentsManagement />} />
        <Route path="contracts" element={<ContractsManagement />} />
        <Route path="verification" element={<VerificationManagement />} />
        <Route path="alerts" element={<AlertsManagement />} />
        <Route path="activity-logs" element={<ActivityLogs />} />
        <Route path="bnb-properties" element={<BnbProperties />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  </RouteGuard>
);

// BNB Owner routes
const BnbOwnerRoutes = () => (
  <RouteGuard requiredRole="bnb_owner">
    <DashboardLayout title="Dashboard">
      <Routes>
        <Route path="" element={<BnbDashboard />} />
        <Route path="bnb-properties" element={<BnbProperties />} />
        <Route path="bnb-properties/add" element={<BnbProperties />} />
        <Route path="browse-bnb-stays" element={<BrowseBnbStays />} />
        <Route path="bnb-property/:id" element={<BnbPropertyDetail />} />
        <Route path="bnb-payment-return" element={<BnbPaymentReturn />} />
        <Route path="bnb-stays" element={<MyBnbStays />} />
        <Route path="bnb-bookings" element={<BnbBookings />} />
        <Route path="bnb-reviews" element={<BnbReviews />} />
        <Route path="bnb-analytics" element={<BnbAnalytics />} />
        <Route path="messages" element={<BnbMessages />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  </RouteGuard>
);

// Commercial routes
const CommercialRoutes = () => (
  <RouteGuard requiredRole="commercial">
    <DashboardLayout title="Dashboard">
      <Routes>
        <Route path="" element={<CommercialDashboard />} />
        <Route path="my-properties" element={<CommercialProperties />} />
        <Route path="properties/add" element={<CommercialAddProperty />} />
        <Route path="properties/:id/edit" element={<CommercialEditProperty />} />
        <Route path="applications" element={<CommercialApplications />} />
        <Route path="payments" element={<CommercialPayments />} />
        <Route path="analytics" element={<CommercialAnalytics />} />
        <Route path="reports" element={<CommercialReports />} />
        <Route path="notifications" element={<CommercialNotifications />} />
        <Route path="profile" element={<CommercialProfile />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard/commercial" replace />} />
      </Routes>
    </DashboardLayout>
  </RouteGuard>
);

// Dashboard redirect component
const DashboardRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userType: UserRole = (user.user_type || user.role || 'tenant') as UserRole;

    const redirectMap: Record<UserRole, string> = {
      admin: '/dashboard/admin',
      agent: '/dashboard/agent',
      landlord: '/dashboard/landlord',
      bnb_owner: '/dashboard/bnb_owner',
      commercial: '/dashboard/commercial',
      tenant: '/dashboard/tenant',
    };

    const targetPath = redirectMap[userType] || '/dashboard/tenant';
    navigate(targetPath, { replace: true });
  }, [user, navigate]);

  return null;
};

// ─────────────────────────────────────
// Root
// ─────────────────────────────────────
function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Dashboard redirect - redirects based on user role */}
            <Route path="/dashboard" element={<DashboardRedirect />} />
            
            {/* Role-specific protected routes */}
            <Route path="/dashboard/tenant/*" element={<TenantRoutes />} />
            <Route path="/dashboard/agent/*" element={<AgentRoutes />} />
            <Route path="/dashboard/landlord/*" element={<LandlordRoutes />} />
            <Route path="/dashboard/bnb_owner/*" element={<BnbOwnerRoutes />} />
            <Route path="/dashboard/commercial/*" element={<CommercialRoutes />} />
            
            {/* Test route outside RouteGuard */}
            <Route path="/test-edit" element={<EditPropertySimple />} />
            <Route path="/dashboard/admin/*" element={<AdminRoutes />} />
            
            {/* Public routes */}
            <Route path="/*" element={<PublicRoutes />} />
          </Routes>
        </Router>
      </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
