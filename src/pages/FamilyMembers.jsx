import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Loader, AlertCircle } from 'lucide-react';
import { getFamily, addFamilyMember } from '../services/familyService';
import { getCurrentUser } from '../services/authService';
import Header from '../components/Layout/Header';
import MemberCard from '../components/Family/MemberCard';
import FamilyInviteModal from '../components/Family/FamilyInviteModal';

export default function FamilyMembers() {
  const navigate = useNavigate();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
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

  const handleAddMember = async (memberData) => {
    if (!family) return;

    try {
      const updatedFamily = await addFamilyMember(family.id, memberData);
      setFamily(updatedFamily);
      setShowInviteModal(false);
    } catch (err) {
      setError('Có lỗi xảy ra khi thêm thành viên');
      console.error('Add member error:', err);
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
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-200">Không tìm thấy nhóm gia đình</p>
          </div>
        </main>
      </div>
    );
  }

  const isOwner = family.ownerId === user?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <button
          onClick={() => navigate('/family')}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Thành viên gia đình</h1>
            <p className="text-slate-400">{family.members?.length || 0} thành viên</p>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Thêm thành viên</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {family.members?.map((member) => (
            <MemberCard key={member.id} member={member} isOwner={isOwner} />
          ))}
        </div>

        {showInviteModal && (
          <FamilyInviteModal
            onClose={() => setShowInviteModal(false)}
            onInvite={handleAddMember}
          />
        )}
      </main>
    </div>
  );
}

