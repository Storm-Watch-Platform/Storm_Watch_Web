import React from 'react';
import { X, MapPin, Clock, Users } from 'lucide-react';

const severityStyle = {
  high: 'bg-red-500/20 text-red-300 border-red-500/40',
  medium: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  low: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
};

export default function ReportModal({ report, onClose }) {
  if (!report) return null;

  const severityClass = severityStyle[report.severity] || severityStyle.low;
  const formattedTime = new Date(report.timestamp).toLocaleString('vi-VN', {
    hour12: false,
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="relative">
          <img
            src={report.images?.[0] ?? 'https://picsum.photos/800/400'}
            alt="Hình ảnh báo cáo"
            className="w-full h-64 object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Người báo cáo</p>
              <h3 className="text-xl font-semibold text-white">{report.userName}</h3>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full border ${severityClass}`}>
              {report.severity === 'high' ? 'Cần cứu hộ' : report.severity === 'medium' ? 'Cảnh báo' : 'Theo dõi'}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{formattedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span>{report.observers} người đã xem</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-slate-200">
            <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <p className="font-medium">{report.address}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${report.location.lat},${report.location.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Mở trên Google Maps
              </a>
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4">
            <p className="text-slate-200 leading-relaxed">{report.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

