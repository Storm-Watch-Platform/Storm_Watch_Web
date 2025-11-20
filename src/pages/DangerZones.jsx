import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle, MapPin } from 'lucide-react';
import { getDangerZonesNearby } from '../services/dangerService';
import { getCurrentUser } from '../services/authService';
import Header from '../components/Layout/Header';
import MapView from '../components/Map/MapView';

export default function DangerZones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const user = getCurrentUser();


  useEffect(() => {
    if (mapLoaded) {
      setTimeout(() => {
        const btn = document.getElementById("auto-get-location");
        btn?.click();
      }, 300);
    }
  }, [mapLoaded]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ xác định vị trí.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: 'Vị trí hiện tại của bạn',
        };
        setUserLocation(location);
        await fetchDangerZones(location.lat, location.lng);
      },
      (err) => {
        setError('Không thể lấy vị trí hiện tại.');
        setLoading(false);
      }
    );
  };

  const fetchDangerZones = async (lat, lng) => {
    try {
      setLoading(true);
      const data = await getDangerZonesNearby(lat, lng, 5000);
      setZones(data || []);
    } catch (err) {
      setError('Có lỗi xảy ra khi tải vùng nguy hiểm');
      console.error('Fetch danger zones error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Vùng nguy hiểm quanh bạn</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {zones.length === 0 ? (
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8 text-center">
                <MapPin className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300 text-lg mb-2">Không có vùng nguy hiểm</p>
                <p className="text-slate-400">Khu vực xung quanh bạn hiện tại an toàn</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {zones.map((zone) => (
                    <div
                      key={zone.id}
                      className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4"
                    >
                      <h3 className="text-lg font-semibold text-white mb-2">{zone.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Mức độ rủi ro:</span>
                          <span
                            className={`font-medium ${zone.riskLevel === 'high'
                              ? 'text-red-400'
                              : zone.riskLevel === 'medium'
                                ? 'text-orange-400'
                                : 'text-yellow-400'
                              }`}
                          >
                            {zone.riskLevel.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Risk Score:</span>
                          <span className="text-white font-medium">{zone.score}/10</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Số báo cáo:</span>
                          <span className="text-blue-400 font-medium">{zone.reportCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {mapLoaded && userLocation && (
                  <div className="h-[600px]">
                    <MapView
                      mapLoaded={mapLoaded}
                      centerLocation={userLocation}
                      reports={[]}
                      onMarkerClick={() => { }}
                      highlightedReport={null}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

