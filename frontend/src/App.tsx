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

const SavedProperties = () => <ComingSoon title="Saved Properties" />;
const MyProperties    = () => <ComingSoon title="My Properties" />;
const AddProperty     = () => <ComingSoon title="Add Property" />;
const MyListings      = () => <ComingSoon title="My Listings" />;
const Leads           = () => <ComingSoon title="Leads" />;
const Commissions     = () => <ComingSoon title="Commissions" />;
const Tenants         = () => <ComingSoon title="Tenants" />;

// Use actual components for agent-specific pages
import AgentLeadsPage from './pages/AgentLeadsPage';
import AgentCommissionsPage from './pages/AgentCommissionsPage';

const AgentLeads = () => {
  console.log('AgentLeads component called - should render AgentLeadsPage');
  return <AgentLeadsPage />;
};
const AgentCommissions = () => {
  console.log('AgentCommissions component called - should render AgentCommissionsPage');
  return <AgentCommissionsPage />;
};

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
    if (!user) return <TenantDashboard />;
    switch (user.userType || user.user_type) {
      case 'landlord': return <LandlordDashboard />;
      case 'agent':    return <AgentDashboard />;
      default:         return <TenantDashboard />;
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
        <Route path="leads"              element={<AgentLeads />} />
        <Route path="commissions"        element={<AgentCommissions />} />
        <Route path="tenants"            element={<Tenants />} />
        <Route path="settings"           element={<SettingsPage />} />
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
          <Route path="/dashboard" element={<DashboardShell />} />
          <Route path="/dashboard/applications" element={<DashboardShell />} />
          <Route path="/dashboard/analytics" element={<DashboardShell />} />
          <Route path="/dashboard/saved-properties" element={<DashboardShell />} />
          <Route path="/dashboard/my-properties" element={<DashboardShell />} />
          <Route path="/dashboard/properties/add" element={<DashboardShell />} />
          <Route path="/dashboard/my-listings" element={<DashboardShell />} />
          <Route path="/dashboard/listings/add" element={<DashboardShell />} />
          <Route path="/dashboard/leads" element={<DashboardShell />} />
          <Route path="/dashboard/commissions" element={<DashboardShell />} />
          <Route path="/dashboard/tenants" element={<DashboardShell />} />
          <Route path="/dashboard/settings" element={<DashboardShell />} />

          {/* Public routes */}
          <Route path="/*" element={<PublicRoutes />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;