import React, { useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';

export default function CoordinateInput({ onSearch, isLoading }) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [error, setError] = useState('');

  const validateCoordinate = (value, type) => {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (type === 'lat') {
      return num >= -90 && num <= 90;
    } else {
      return num >= -180 && num <= 180;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!lat || !lng) {
      setError('Vui lòng nhập đầy đủ tọa độ');
      return;
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (!validateCoordinate(lat, 'lat')) {
      setError('Vĩ độ phải từ -90 đến 90');
      return;
    }

    if (!validateCoordinate(lng, 'lng')) {
      setError('Kinh độ phải từ -180 đến 180');
      return;
    }

    onSearch({ lat: latNum, lng: lngNum });
  };

  const handleClear = () => {
    setLat('');
    setLng('');
    setError('');
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toFixed(6));
          setLng(position.coords.longitude.toFixed(6));
          setError('');
        },
        (err) => {
          setError('Không thể lấy vị trí hiện tại. Vui lòng nhập thủ công.');
        }
      );
    } else {
      setError('Trình duyệt không hỗ trợ định vị');
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-bold text-white">Tìm kiếm theo tọa độ</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Vĩ độ (Latitude)
            </label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Ví dụ: 10.7971"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Kinh độ (Longitude)
            </label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="Ví dụ: 106.6818"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang tìm kiếm...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Tìm kiếm vùng 5km</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all text-sm"
          >
            Vị trí hiện tại
          </button>

          {(lat || lng) && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Nhập tọa độ để tìm kiếm vùng bán kính 5km và các báo cáo liên quan
        </p>
      </form>
    </div>
  );
}

