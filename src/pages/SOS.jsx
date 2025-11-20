import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { sendSOS, getActiveSOS } from '../services/sosService';
import { getCurrentUser } from '../services/authService';
import { formatRelativeTime } from '../utils/formatTime';
import Header from '../components/Layout/Header';
import SOSButton from '../components/SOS/SOSButton';
import SOSModal from '../components/SOS/SOSModal';

export default function SOS() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [activeSOS, setActiveSOS] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);

  const user = getCurrentUser();

  // 1. Check login separately
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user]);

  // 2. Load SOS & location only ONE time
  useEffect(() => {
    getCurrentLocation();
    fetchActiveSOS();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ xác định vị trí.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: 'Vị trí hiện tại của bạn',
        });
      },
      (err) => {
        setError('Không thể lấy vị trí hiện tại.');
      }
    );
  };

  const fetchActiveSOS = async () => {
    try {
      const data = await getActiveSOS();
      const userSOS = data.find((sos) => sos.userId === user?.id);
      setActiveSOS(userSOS || null);
    } catch (err) {
      console.error('Fetch active SOS error:', err);
    }
  };

  const handleSendSOS = async (message) => {
    if (!userLocation) {
      setError('Không thể lấy vị trí. Vui lòng thử lại.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const sos = await sendSOS(userLocation, message);
      setActiveSOS(sos);
      setSuccess('Đã gửi tín hiệu SOS thành công!');
      setShowModal(false);
    } catch (err) {
      setError('Có lỗi xảy ra khi gửi tín hiệu SOS. Vui lòng thử lại.');
      console.error('Send SOS error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8">Tín hiệu SOS</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-200">{success}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* SOS Button */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8 text-center">
            <AlertTriangle className="w-24 h-24 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Cần hỗ trợ khẩn cấp?</h2>
            <p className="text-slate-400 mb-6">
              Nhấn nút bên dưới để gửi tín hiệu SOS. Tín hiệu sẽ được gửi đến các đội cứu hộ gần nhất.
            </p>
            <SOSButton
              onClick={() => setShowModal(true)}
              disabled={loading || !!activeSOS}
              active={!!activeSOS}
            />
          </div>

          {/* Active SOS Status */}
          {activeSOS && (
            <div className="bg-red-500/20 border border-red-500 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-semibold text-white">Tín hiệu SOS đang hoạt động</h3>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{activeSOS.address || 'Đang xác định...'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Thời gian:</span>
                  <span>{formatRelativeTime(activeSOS.timestamp)}</span>
                </div>
                {activeSOS.message && (
                  <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-200">{activeSOS.message}</p>
                  </div>
                )}
                {activeSOS.status === 'responded' && (
                  <div className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded-lg">
                    <p className="text-green-200">Đã có đội cứu hộ phản hồi</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Hướng dẫn sử dụng</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Chỉ sử dụng SOS trong trường hợp khẩn cấp thực sự</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Đảm bảo bạn đã bật định vị GPS</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Tín hiệu SOS sẽ được gửi đến các đội cứu hộ trong bán kính 10km</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Vị trí của bạn sẽ được cập nhật tự động</span>
              </li>
            </ul>
          </div>
        </div>

        {showModal && (
          <SOSModal
            onClose={() => setShowModal(false)}
            onSend={handleSendSOS}
            loading={loading}
            location={userLocation}
          />
        )}
      </main>
    </div>
  );
}

