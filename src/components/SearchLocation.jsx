import React, { useEffect, useRef, useState } from 'react';
import { Search, Loader2, Crosshair } from 'lucide-react';

export default function SearchLocation({ onLocationSelect, isDisabled, regions = [], mapsReady }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [manualAddress, setManualAddress] = useState('');
  const [initialised, setInitialised] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mapsReady || initialised) return;
    if (!window.google || !window.google.maps || !window.google.maps.places) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'formatted_address', 'name'],
      componentRestrictions: { country: ['vn'] },
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry) return;

      const location = place.geometry.location;
      const selectedLocation = {
        lat: location.lat(),
        lng: location.lng(),
        address: place.formatted_address || place.name,
      };

      setManualAddress(selectedLocation.address || '');
      setError('');
      onLocationSelect(selectedLocation);
    });

    setInitialised(true);
  }, [mapsReady, initialised, onLocationSelect]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualAddress || isDisabled) return;
    if (!window.google || !window.google.maps) {
      setError('Google Maps chưa sẵn sàng. Vui lòng đợi trong giây lát.');
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: manualAddress }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        setError('');
        onLocationSelect({
          lat: location.lat(),
          lng: location.lng(),
          address: results[0].formatted_address,
        });
      } else {
        setError('Không tìm thấy địa điểm. Thử nhập cụ thể hơn.');
      }
    });
  };

  const handleRegionChange = (e) => {
    const regionId = e.target.value;
    setSelectedRegion(regionId);
    const region = regions.find((r) => r.id === regionId);
    if (region) {
      setManualAddress(region.address);
      setError('');
      onLocationSelect({
        lat: region.center.lat,
        lng: region.center.lng,
        address: region.address,
      });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ xác định vị trí.');
      return;
    }
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onLocationSelect({
          lat: latitude,
          lng: longitude,
          address: 'Vị trí hiện tại của bạn',
        });
      },
      () => {
        setError('Không thể lấy vị trí. Hãy bật quyền truy cập vị trí cho trình duyệt.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="bg-slate-800/70 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 shadow-xl space-y-4">
      <div className="flex flex-col gap-2">
        <label className="block text-sm font-semibold text-slate-200">
          Chọn nhanh vùng theo tỉnh/thành
        </label>
        <select
          className="bg-slate-900/70 border border-slate-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedRegion}
          onChange={handleRegionChange}
          disabled={isDisabled}
        >
          <option value="">-- Chọn vùng --</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleManualSubmit}>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Tìm kiếm vị trí trên bản đồ
        </label>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="Nhập địa điểm (VD: Kim Long, Huế)..."
                className="w-full bg-slate-900/70 text-white placeholder:text-slate-500 border border-slate-600 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                disabled={isDisabled}
              />
            </div>
            <button
              type="submit"
              disabled={isDisabled}
              className="px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold flex items-center gap-2 disabled:bg-blue-500/40 disabled:cursor-not-allowed transition-all"
            >
              {isDisabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Tìm</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isDisabled}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-600 text-slate-200 hover:bg-slate-700/60 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Crosshair className="w-4 h-4" />
            Dùng vị trí hiện tại
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Có thể nhập địa chỉ, chọn tỉnh trong danh sách hoặc dùng vị trí hiện tại. Hệ thống sẽ hiển thị các báo cáo
          trong bán kính 5km gần nhất.
        </p>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </form>
    </div>
  );
}

