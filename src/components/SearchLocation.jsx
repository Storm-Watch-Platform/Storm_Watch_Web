import React, { useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function SearchLocation({ onLocationSelect, isDisabled }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [manualAddress, setManualAddress] = useState('');
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places || initialised) return;

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
      onLocationSelect(selectedLocation);
    });

    setInitialised(true);
  }, [initialised, onLocationSelect]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualAddress || isDisabled) return;
    if (!window.google || !window.google.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: manualAddress }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        onLocationSelect({
          lat: location.lat(),
          lng: location.lng(),
          address: results[0].formatted_address,
        });
      }
    });
  };

  return (
    <div className="bg-slate-800/70 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 shadow-xl">
      <form onSubmit={handleManualSubmit}>
        <label className="block text-sm font-semibold text-slate-200 mb-2">
          Tìm kiếm vị trí trên bản đồ
        </label>
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
        <p className="text-xs text-slate-400 mt-2">
          Có thể nhập địa chỉ hoặc chọn gợi ý giống Google Maps. Hệ thống sẽ hiển thị các báo cáo trong bán kính 5km.
        </p>
      </form>
    </div>
  );
}

