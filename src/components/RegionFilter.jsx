import React from 'react';
import { ChevronDown, MapPin } from 'lucide-react';

const REGIONS = [
  {
    id: 'all',
    name: 'Tất cả khu vực',
    coordinates: { lat: 11.0, lng: 107.0 },
    zoom: 7,
    bounds: null
  },
  {
    id: 'hcm',
    name: 'TP. Hồ Chí Minh',
    coordinates: { lat: 10.8, lng: 106.68 },
    zoom: 13,
    bounds: {
      north: 10.95,
      south: 10.65,
      east: 106.9,
      west: 106.4
    }
  },
  {
    id: 'binh-dinh',
    name: 'Bình Định',
    coordinates: { lat: 13.8, lng: 109.3 },
    zoom: 11,
    bounds: {
      north: 14.0,
      south: 13.6,
      east: 109.5,
      west: 109.1
    }
  },
  {
    id: 'khanh-hoa',
    name: 'Khánh Hòa',
    coordinates: { lat: 12.2, lng: 109.2 },
    zoom: 11,
    bounds: {
      north: 12.5,
      south: 11.9,
      east: 109.5,
      west: 108.9
    }
  },
  {
    id: 'quang-nam',
    name: 'Quảng Nam',
    coordinates: { lat: 15.6, lng: 108.0 },
    zoom: 11,
    bounds: {
      north: 15.9,
      south: 15.3,
      east: 108.4,
      west: 107.6
    }
  },
  {
    id: 'quang-ngai',
    name: 'Quảng Ngãi',
    coordinates: { lat: 14.8, lng: 108.8 },
    zoom: 11,
    bounds: {
      north: 15.1,
      south: 14.5,
      east: 109.2,
      west: 108.4
    }
  },
  {
    id: 'ba-ria',
    name: 'Bà Rịa - Vũng Tàu',
    coordinates: { lat: 10.4, lng: 107.2 },
    zoom: 11,
    bounds: {
      north: 10.6,
      south: 10.2,
      east: 107.5,
      west: 106.9
    }
  },
  {
    id: 'tien-giang',
    name: 'Tiền Giang',
    coordinates: { lat: 10.35, lng: 106.36 },
    zoom: 11,
    bounds: {
      north: 10.55,
      south: 10.15,
      east: 106.6,
      west: 106.1
    }
  }
];

export default function RegionFilter({ 
  selectedRegion, 
  setSelectedRegion, 
  onRegionChange,
  isOpen,
  setIsOpen 
}) {
  const currentRegion = REGIONS.find(r => r.id === selectedRegion) || REGIONS[0];

  const handleRegionSelect = (regionId) => {
    const region = REGIONS.find(r => r.id === regionId);
    if (region) {
      setSelectedRegion(regionId);
      onRegionChange(region);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full md:w-64">
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-white border-2 border-emerald-500 rounded-lg flex items-center justify-between hover:bg-emerald-50 transition"
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-medium text-slate-700">{currentRegion.name}</span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-emerald-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <div className="max-h-96 overflow-y-auto">
            {REGIONS.map(region => (
              <button
                key={region.id}
                onClick={() => handleRegionSelect(region.id)}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-emerald-50 transition flex items-center gap-3 ${
                  selectedRegion === region.id 
                    ? 'bg-emerald-100 text-emerald-900 font-medium' 
                    : 'text-slate-700'
                }`}
              >
                <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                  selectedRegion === region.id 
                    ? 'border-emerald-600 bg-emerald-600' 
                    : 'border-slate-300'
                }`}>
                  {selectedRegion === region.id && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </div>
                {region.name}
                {region.id !== 'all' && (
                  <span className="ml-auto text-xs text-slate-400">
                    Zoom {region.zoom}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500 bg-slate-50">
            {selectedRegion === 'all' 
              ? 'Hiển thị toàn bộ các khu vực' 
              : `Hiển thị dữ liệu tại ${currentRegion.name}`}
          </div>
        </div>
      )}
    </div>
  );
}
