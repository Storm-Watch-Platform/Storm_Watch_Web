import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navigation, Home, Users, AlertTriangle, MapPin, LogOut, User } from 'lucide-react';
import { getCurrentUser, logout, isAuthenticated } from '../../services/authService';

export default function Header() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-blue-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-700">StormWatch</h1>
              <p className="text-sm text-blue-600">Giám sát bão lũ cộng đồng</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {authenticated ? (
              <>
                <Link
                  to="/"
                  className="flex items-center gap-2 px-3 py-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Home className="w-5 h-5" />
                  <span className="hidden md:inline">Trang chủ</span>
                </Link>
                <Link
                  to="/reports/create"
                  className="flex items-center gap-2 px-3 py-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <span className="hidden md:inline">Báo cáo</span>
                </Link>
                <Link
                  to="/family"
                  className="flex items-center gap-2 px-3 py-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span className="hidden md:inline">Gia đình</span>
                </Link>
                <Link
                  to="/danger-zones"
                  className="flex items-center gap-2 px-3 py-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  <span className="hidden md:inline">Vùng nguy hiểm</span>
                </Link>
                <Link
                  to="/sos"
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="hidden md:inline">SOS</span>
                </Link>
                <div className="flex items-center gap-2 px-3 py-2 text-blue-700">
                  <User className="w-5 h-5" />
                  <span className="hidden md:inline text-sm font-medium">{user?.name || 'Người dùng'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden md:inline">Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-blue-700 hover:text-blue-800 transition-colors font-medium"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Đăng ký
                </Link>
              </>
            )}
            <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 text-sm font-medium hidden md:inline">Live Updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}