import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, LogOut, Loader, AlertCircle } from 'lucide-react';
import { getProfile, logout } from '../services/authService';
import Header from '../components/Layout/Header';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      setError('Không thể tải thông tin cá nhân');
      console.error('Fetch profile error:', err);
      // If unauthorized, redirect to login
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Header />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader className="w-8 h-8 text-blue-400 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <User className="w-12 h-12 text-slate-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{profile?.name || 'Người dùng'}</h1>
            <p className="text-slate-400">Thành viên StormWatch</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-1">
                <User className="w-5 h-5 text-blue-400" />
                <span className="text-slate-400 text-sm">Họ và tên</span>
              </div>
              <p className="text-white font-medium pl-8">{profile?.name || 'Chưa cập nhật'}</p>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-1">
                <Phone className="w-5 h-5 text-blue-400" />
                <span className="text-slate-400 text-sm">Số điện thoại</span>
              </div>
              <p className="text-white font-medium pl-8">{profile?.phone || 'Chưa cập nhật'}</p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold rounded-lg transition-colors border border-red-600/50 flex items-center justify-center gap-2 mt-8"
            >
              <LogOut className="w-5 h-5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
