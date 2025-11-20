import React from 'react';
import { Users, MapPin, Clock, AlertCircle } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatTime';

const statusColors = {
  safe: 'text-green-400',
  warning: 'text-yellow-400',
  danger: 'text-red-400',
};

const statusLabels = {
  safe: 'An toàn',
  warning: 'Cảnh báo',
  danger: 'Nguy hiểm',
};

export default function FamilyPanel({ family }) {
  if (!family || !family.members) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8 text-center">
        <p className="text-slate-400">Không có thành viên</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" />
          <span>Thành viên gia đình</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {family.members.map((member) => (
            <div
              key={member.id}
              className="bg-slate-700/50 border border-slate-600 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">{member.name}</h3>
                <span className={`text-xs font-medium ${statusColors[member.status] || statusColors.safe}`}>
                  {statusLabels[member.status] || statusLabels.safe}
                </span>
              </div>
              <div className="space-y-1 text-sm text-slate-300">
                {member.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{member.location.lat.toFixed(4)}, {member.location.lng.toFixed(4)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{formatRelativeTime(member.lastSeen)}</span>
                </div>
                {member.role === 'owner' && (
                  <span className="inline-block mt-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                    Chủ nhóm
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Alert */}
      {family.members.some((m) => m.status === 'danger') && (
        <div className="bg-red-500/20 border border-red-500 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold text-white">Cảnh báo nguy hiểm</h3>
          </div>
          <p className="text-red-200 text-sm">
            Có {family.members.filter((m) => m.status === 'danger').length} thành viên đang trong vùng nguy hiểm
          </p>
        </div>
      )}
    </div>
  );
}

