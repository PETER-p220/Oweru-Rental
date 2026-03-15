import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
import AgentDashboard from './pages/AgentDashboard';
import Applications from './pages/Applications';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/Settings';
import AddListing from './pages/AddListing';
import DashboardLayout from './components/DashboardLayout';
import { ThemeProvider } from './contexts/ThemeContext';

// Tenant pages
import Contract from './pages/tenant/Contract';
import Payments from './pages/tenant/Payments';
import PaymentHistory from './pages/tenant/PaymentHistory';
import Notifications from './pages/tenant/Notifications';
import Messages from './pages/tenant/Messages';
import SavedProperties from './pages/tenant/SavedProperties';

// Landlord pages
import MyProperties from './pages/landlord/MyProperties';
import MyTenants from './pages/landlord/MyTenants';

// ─────────────────────────────────────────────
// Stub pages (no DashboardLayout — the shell provides it)
// ─────────────────────────────────────────────
const ComingSoon = ({ title }: { title: string }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 400, flexDirection: 'column', gap: 16,
  }}>
    <div style={{
      width: 52, height: 52,
      background: 'rgba(201,168,76,0.06)',
      border: '1px solid rgba(201,168,76,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#c9a84c', fontSize: 22,
    }}>✦</div>
    <div style={{
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      fontSize: 28, fontWeight: 300,
      color: '#f5f0e8', letterSpacing: '-0.02em',
    }}>{title}</div>
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 13, fontWeight: 300, color: '#8a8070',
    }}>This page is coming soon.</div>
  </div>
);

const AddProperty     = () => <ComingSoon title="Add Property" />;

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';

// Agent pages
import MyListings from './pages/agent/MyListings';
import LinkedOwners from './pages/agent/LinkedOwners';
import QRCodes from './pages/agent/QRCodes';
import ShareAndTrack from './pages/agent/ShareAndTrack';
import PayoutHistory from './pages/agent/PayoutHistory';
import LeadsAndVisitors from './pages/agent/LeadsAndVisitors';
import MyCommissions from './pages/agent/MyCommissions';

// ─────────────────────────────────────────────
// Public routes  (Header + Footer)
// ─────────────────────────────────────────────
const PublicRoutes = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/properties"   element={<Properties />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/about"        element={<About />} />
        <Route path="/contact"      element={<Contact />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/register"     element={<Register />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

// ─────────────────────────────────────────────
// Dashboard shell — ONE DashboardLayout wrapping all dashboard routes.
// Individual page components must NOT render their own <DashboardLayout>.
// They should only export their inner content (the part inside dl-content).
// ─────────────────────────────────────────────
const DashboardShell = () => {
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      try { 
        const parsedUser = JSON.parse(raw);
        console.log('Loaded user:', parsedUser); // Debug log
        setUser(parsedUser); 
      }
      catch (e) { console.error('Error parsing user:', e); }
    }
  }, [location.pathname]); // Re-run on route change

  const getDashboardPage = () => {
    if (!user) {
      console.log('No user found, defaulting to TenantDashboard');
      return <TenantDashboard />;
    }
    
    // Try multiple possible field names for user type
    const userType = user.userType || 
                     user.user_type || 
                     user.role || 
                     user.userRole || 
                     user.user_role || 
                     'tenant';
    
    console.log('User object:', user);
    console.log('User object keys:', user ? Object.keys(user) : 'No user');
    console.log('Detected user type:', userType);

    switch (userType) {
      case 'landlord':
        console.log('Rendering LandlordDashboard');
        return <LandlordDashboard />;
      case 'agent':
        console.log('Rendering AgentDashboard');
        return <AgentDashboard />;
      case 'admin':
        console.log('Rendering AdminDashboard');
        return <AdminDashboard />;
      default:
        console.log('Defaulting to TenantDashboard for type:', userType);
        return <TenantDashboard />;
    }
  };

  // Debug: Log current path and what should be rendered
  console.log('Current path:', window.location.pathname);
  console.log('User type for routing:', user?.userType || user?.user_type);
  
  // Debug: Log when DashboardShell renders
  console.log('DashboardShell rendering for path:', window.location.pathname);

  // Derive page title from current path for the topbar breadcrumb
  const titleMap: Record<string, string> = {
    '/dashboard':               'Dashboard',
    '/dashboard/applications':  'Applications',
    '/dashboard/analytics':     'Analytics',
    '/dashboard/saved-properties': 'Saved Properties',
    '/dashboard/my-properties': 'My Properties',
    '/dashboard/properties/add': 'Add Property',
    '/dashboard/my-listings':   'My Listings',
    '/dashboard/listings/add':  'Add Listing',
    '/dashboard/leads':         'Leads',
    '/dashboard/commissions':   'Commissions',
    '/dashboard/tenants':       'Tenants',
    '/dashboard/settings':      'Settings',
    // Tenant pages
    '/dashboard/contract':      'My Contract',
    '/dashboard/payments':      'Rent Payments',
    '/dashboard/payment-history': 'Payment History',
    '/dashboard/notifications': 'Notifications',
    '/dashboard/messages':      'Messages',
  };

  const path = window.location.pathname;
  const title = titleMap[path] ?? 'Dashboard';

  return (
    <DashboardLayout title={title} user={user}>
      <Routes>
        <Route path=""          element={getDashboardPage()} />
        <Route path="applications"       element={<Applications />} />
        <Route path="analytics"          element={<Analytics />} />
        <Route path="saved-properties"   element={<SavedProperties />} />
        <Route path="my-properties"      element={<MyProperties />} />
        <Route path="properties/add"     element={<AddListing />} />
        <Route path="my-listings"        element={<MyListings />} />
        <Route path="listings/add"       element={<AddListing />} />
        <Route path="tenants"            element={<MyTenants />} />
        <Route path="settings"           element={<SettingsPage />} />
        {/* Admin pages */}
        <Route path="users"              element={<UserManagement />} />
        {/* Agent pages */}
        <Route path="linked-owners"      element={<LinkedOwners />} />
        <Route path="qr-codes"           element={<QRCodes />} />
        <Route path="tracking"           element={<ShareAndTrack />} />
        <Route path="payouts"            element={<PayoutHistory />} />
        <Route path="leads"              element={<LeadsAndVisitors />} />
        <Route path="commissions"        element={<MyCommissions />} />
        {/* Tenant pages */}
        <Route path="contract"           element={<Contract />} />
        <Route path="payments"           element={<Payments />} />
        <Route path="payment-history"    element={<PaymentHistory />} />
        <Route path="notifications"      element={<Notifications />} />
        <Route path="messages"           element={<Messages />} />
        <Route path="saved-properties"   element={<SavedProperties />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

// ─────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────
function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Dashboard routes with sidebar - all under /dashboard */}
          <Route path="/dashboard/*" element={<DashboardShell />} />
          
          {/* Public routes */}
          <Route path="/*" element={<PublicRoutes />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;