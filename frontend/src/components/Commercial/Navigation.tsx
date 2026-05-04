import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Home, 
  Plus, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
  X, 
  TrendingUp,
  FileText,
  Bell
} from 'lucide-react';

const CommercialNavigation: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/commercial/dashboard',
      icon: Home,
      current: location.pathname === '/commercial/dashboard'
    },
    {
      name: 'Properties',
      href: '/commercial/properties',
      icon: Building2,
      current: location.pathname.startsWith('/commercial/properties')
    },
    {
      name: 'Add Property',
      href: '/commercial/properties/add',
      icon: Plus,
      current: location.pathname === '/commercial/properties/add'
    },
    {
      name: 'Analytics',
      href: '/commercial/analytics',
      icon: TrendingUp,
      current: location.pathname === '/commercial/analytics'
    },
    {
      name: 'Reports',
      href: '/commercial/reports',
      icon: FileText,
      current: location.pathname === '/commercial/reports'
    },
    {
      name: 'Profile',
      href: '/commercial/profile',
      icon: User,
      current: location.pathname === '/commercial/profile'
    },
    {
      name: 'Settings',
      href: '/commercial/settings',
      icon: Settings,
      current: location.pathname === '/commercial/settings'
    }
  ];

  const isActive = (item: typeof navigation[0]) => {
    if (item.current) return true;
    if (item.href === '/commercial/properties' && location.pathname.startsWith('/commercial/properties')) {
      return location.pathname !== '/commercial/properties/add';
    }
    return false;
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-navy-800 border-r border-navy-700 transform transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-navy-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-navy-900" />
            </div>
            <span className="text-white font-semibold">OWERU</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive(item)
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : 'text-gray-300 hover:text-white hover:bg-navy-700'
                }
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-navy-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:bg-navy-800 lg:border-r lg:border-navy-700">
        <div className="flex items-center h-16 px-6 border-b border-navy-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-navy-900" />
            </div>
            <span className="text-white font-semibold">OWERU</span>
            <span className="text-xs text-gray-400 ml-auto">Commercial</span>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive(item)
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : 'text-gray-300 hover:text-white hover:bg-navy-700'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-navy-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-navy-800 border-b border-navy-700">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gold rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-navy-900" />
              </div>
              <span className="text-white font-semibold">OWERU</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-400 rounded-full"></span>
            </button>
            <div className="w-8 h-8 bg-navy-700 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommercialNavigation;
