import React from 'react';
import { MapPin, AlertCircle, Clock, Users } from 'lucide-react';

const severityConfig = {
  high: { label: 'Cần cứu hộ', color: 'bg-red-500/20 text-red-300 border-red-500/40' },
  medium: { label: 'Cảnh báo', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  low: { label: 'Theo dõi', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
};

const formatRelativeTime = (timestamp) => {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${Math.floor(diffHours / 24)} ngày trước`;
};

export default function ReportsPanel({ reports, onFocusReport, onOpenReport, selectedReport, centerAddress }) {
  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-2xl h-full flex flex-col">
      <div className="p-4 border-b border-slate-700/60">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Báo cáo trong bán kính 5km</p>
            <h3 className="text-2xl font-bold text-white">{reports.length}</h3>
          </div>
        </div>
        {centerAddress && (
          <div className="mt-3 text-sm text-slate-400 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-400 mt-1" />
            <span>{centerAddress}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {reports.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <AlertCircle className="w-6 h-6 mx-auto mb-3 text-slate-500" />
            <p>Không có báo cáo nào trong 3 ngày gần nhất.</p>
          </div>
        )}

        {reports.map((report) => {
          const severity = severityConfig[report.severity] || severityConfig.low;
          const isActive = selectedReport?.id === report.id;

          return (
            <div
              key={report.id}
              className={`border rounded-2xl p-4 transition-all cursor-pointer ${
                isActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800'
              }`}
              onClick={() => onFocusReport(report)}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-slate-300 font-semibold">{report.userName}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(report.timestamp)}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full border ${severity.color}`}>
                  {severity.label}
                </span>
              </div>

              <div className="text-sm text-slate-300 flex items-start gap-2 mb-3">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>{report.address}</span>
              </div>

              <p className="text-slate-200 text-sm mb-4 overflow-hidden text-ellipsis">{report.description}</p>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{report.observers} người đã xem</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenReport(report);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

