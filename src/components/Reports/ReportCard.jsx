import React from 'react';
import { MapPin, Clock, Users } from 'lucide-react';

export default function ReportCard({ report, selectedReport, onViewOnMap }) {
  const getRiskColor = (level) => {
    return level === 'high' ? 'bg-red-500' : 
           level === 'medium' ? 'bg-orange-500' : 'bg-yellow-500';
  };

  const getSeverityLabel = (severity) => {
    return severity === 'high' ? 'Khẩn cấp' : 
           severity === 'medium' ? 'Trung bình' : 'Thấp';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    
    if (diff < 1) return 'Vừa xong';
    if (diff < 60) return `${diff} phút trước`;
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div
      className={`bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border transition-all hover:scale-105 hover:shadow-2xl ${
        selectedReport?.id === report.id
          ? 'border-blue-500 ring-2 ring-blue-500/50'
          : 'border-slate-700 hover:border-slate-600'
      }`}
    >
      {/* Image */}
      <div className="relative h-48 bg-slate-900">
        <img
          src={report.images[0]}
          alt="Report"
          className="w-full h-full object-cover"
        />
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white ${getRiskColor(report.severity)}`}>
          {getSeverityLabel(report.severity)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-white mb-1">{report.userName}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Clock className="w-4 h-4" />
              {formatTime(report.timestamp)}
            </div>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">{report.observers}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 mb-3">
          <MapPin className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
          <p className="text-sm text-slate-300">{report.address}</p>
        </div>

        <p className="text-slate-200 mb-4">{report.description}</p>

        <button
          onClick={() => onViewOnMap(report)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-all"
        >
          Xem trên bản đồ
        </button>
      </div>
    </div>
  );
}