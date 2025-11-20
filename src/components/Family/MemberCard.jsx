import React from 'react';
import { MapPin, Clock, User, Phone } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatTime';

const statusColors = {
  safe: 'bg-green-500/20 text-green-400 border-green-500/40',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  danger: 'bg-red-500/20 text-red-400 border-red-500/40',
};

const statusLabels = {
  safe: 'An toàn',
  warning: 'Cảnh báo',
  danger: 'Nguy hiểm',
};

export default function MemberCard({ member, isOwner }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{member.name}</h3>
            {member.role === 'owner' && (
              <span className="text-xs text-blue-400">Chủ nhóm</span>
            )}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[member.status] || statusColors.safe}`}>
          {statusLabels[member.status] || statusLabels.safe}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {member.phone && (
          <div className="flex items-center gap-2 text-slate-300">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>{member.phone}</span>
          </div>
        )}
        {member.location && (
          <div className="flex items-start gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs">{member.location.lat.toFixed(6)}, {member.location.lng.toFixed(6)}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${member.location.lat},${member.location.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Xem trên bản đồ
              </a>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-xs">Hoạt động: {formatRelativeTime(member.lastSeen)}</span>
        </div>
      </div>
    </div>
  );
}

