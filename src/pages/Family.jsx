import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Loader, AlertCircle, ArrowRight } from 'lucide-react';
import { getFamily, createFamily } from '../services/familyService';
import { getCurrentUser } from '../services/authService';
import Header from '../components/Layout/Header';
import FamilyPanel from '../components/Family/FamilyPanel';

export default function Family() {
  const navigate = useNavigate();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const user = getCurrentUser();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchFamily();
  }, [user, navigate]);

  const fetchFamily = async () => {
    try {
      setLoading(true);
      const data = await getFamily();
      setFamily(data);
    } catch (err) {
      setError('Có lỗi xảy ra khi tải thông tin gia đình');
      console.error('Fetch family error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async () => {
    if (!user) return;

    const name = prompt('Nhập tên nhóm gia đình:');
    if (!name) return;

    setCreating(true);
    try {
      const newFamily = await createFamily({
        name: name.trim(),
        ownerId: user.id,
        ownerName: user.name,
        phone: user.phone,
      });
      setFamily(newFamily);
    } catch (err) {
      setError('Có lỗi xảy ra khi tạo nhóm gia đình');
      console.error('Create family error:', err);
    } finally {
      setCreating(false);
    }
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

  if (!family) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-16">
            <Users className="w-24 h-24 text-slate-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Chưa có nhóm gia đình</h1>
            <p className="text-slate-400 mb-8">
              Tạo nhóm gia đình để theo dõi và bảo vệ các thành viên trong gia đình bạn
            </p>
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center justify-center gap-3 max-w-md mx-auto">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
            <button
              onClick={handleCreateFamily}
              disabled={creating}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {creating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Tạo nhóm gia đình</span>
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{family.name}</h1>
            <p className="text-slate-400">{family.members?.length || 0} thành viên</p>
          </div>
          <button
            onClick={() => navigate('/family/members')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <span>Quản lý thành viên</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <FamilyPanel family={family} />
      </main>
    </div>
  );
}

