import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import TenantDashboard from './pages/TenantDashboard';
import LandlordDashboard from './pages/LandlordDashboard';
import SettingsPage from './pages/Settings';
import DashboardLayout from './components/DashboardLayout';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RouteGuard from './components/RouteGuard';

// Tenant pages
import Contract from './pages/tenant/Contract';
import Payments from './pages/tenant/Payments';
import PaymentHistory from './pages/tenant/PaymentHistory';
import Notifications from './pages/tenant/Notifications';
import Messages from './pages/tenant/Messages';
import SavedProperties from './pages/tenant/SavedProperties';
import TenantApplicationsPage from './pages/tenant/ApplicationsPage';
import TenantAnalyticsPage from './pages/tenant/AnalyticsPage';

// Landlord pages
import MyProperties from './pages/landlord/MyProperties';
import MyTenants from './pages/landlord/MyTenants';
import AddProperty from './pages/landlord/AddProperty';
import EditPropertySimple from './pages/landlord/EditPropertySimple';
import ApplicationsPage from './pages/landlord/ApplicationsPage';
import ContractsPage from './pages/landlord/ContractsPage';
import RentCollectionPage from './pages/landlord/RentCollectionPage';
import ReceiptsPage from './pages/landlord/ReceiptsPage';
import CommissionReportsPage from './pages/landlord/CommissionReportsPage';
import LandlordAnalyticsPage from './pages/landlord/AnalyticsPage';
import LandlordMessagesPage from './pages/landlord/MessagesPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import PropertiesManagement from './pages/admin/PropertiesManagement';
import TransactionsManagement from './pages/admin/TransactionsManagement';
import CommissionControl from './pages/admin/CommissionControl';
// Temporarily disabled admin pages with encoding issues
// import PaymentsManagement from './pages/admin/PaymentsManagement';
// import ContractsManagement from './pages/admin/ContractsManagement';
// import VerificationManagement from './pages/admin/VerificationManagement';
// import AlertsManagement from './pages/admin/AlertsManagement';
import SystemSettings from './pages/admin/SystemSettings';

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
import AgentApplicationsPage from './pages/agent/ApplicationsPage';
import AgentAnalyticsPage from './pages/agent/AnalyticsPage';
import AgentMessagesPage from './pages/agent/MessagesPage';

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
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
        <Route path="analytics" element={<TenantAnalyticsPage />} />
        <Route path="saved-properties" element={<SavedProperties />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="contract" element={<Contract />} />
        <Route path="payments" element={<Payments />} />
        <Route path="payment-history" element={<PaymentHistory />} />
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
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="tenants" element={<MyTenants />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="rent-collection" element={<RentCollectionPage />} />
        <Route path="receipts" element={<ReceiptsPage />} />
        <Route path="commissions" element={<CommissionReportsPage />} />
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
        <Route path="transactions" element={<TransactionsManagement />} />
        <Route path="commission" element={<CommissionControl />} />
        {/* Temporarily disabled admin routes with encoding issues */}
        {/* <Route path="payments" element={<PaymentsManagement />} /> */}
        {/* <Route path="contracts" element={<ContractsManagement />} /> */}
        {/* <Route path="verification" element={<VerificationManagement />} /> */}
        {/* <Route path="alerts" element={<AlertsManagement />} /> */}
        <Route path="settings" element={<SystemSettings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  </RouteGuard>
);

// Dashboard redirect component
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const userType = user.userType || user.user_type || user.role || 'tenant';
  
  switch (userType) {
    case 'admin':
      return <Navigate to="/dashboard/admin" replace />;
    case 'agent':
      return <Navigate to="/dashboard/agent" replace />;
    case 'landlord':
      return <Navigate to="/dashboard/landlord" replace />;
    default:
      return <Navigate to="/dashboard/tenant" replace />;
  }
};

// ─────────────────────────────────────
// Root
// ─────────────────────────────────────
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Dashboard redirect - redirects based on user role */}
            <Route path="/dashboard" element={<DashboardRedirect />} />
            
            {/* Role-specific protected routes */}
            <Route path="/dashboard/tenant/*" element={<TenantRoutes />} />
            <Route path="/dashboard/agent/*" element={<AgentRoutes />} />
            <Route path="/dashboard/landlord/*" element={<LandlordRoutes />} />
            
            {/* Test route outside RouteGuard */}
            <Route path="/test-edit" element={<EditPropertySimple />} />
            <Route path="/dashboard/admin/*" element={<AdminRoutes />} />
            
            {/* Public routes */}
            <Route path="/*" element={<PublicRoutes />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
