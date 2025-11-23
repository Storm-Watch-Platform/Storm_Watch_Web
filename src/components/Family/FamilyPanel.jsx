import React from 'react';
import { Users, MapPin, Clock, AlertCircle, Phone } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatTime';

const statusColors = {
  safe: 'text-green-400',
  warning: 'text-yellow-400',
  danger: 'text-red-400',
  unknown: 'text-gray-400',
};

const statusLabels = {
  safe: 'An toàn',
  warning: 'Cảnh báo',
  danger: 'Nguy hiểm',
  unknown: 'Không xác định',
};

const statusColorsLight = {
  safe: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  unknown: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function FamilyPanel({ family }) {
  if (!family || !family.members || family.members.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-12 text-center shadow-lg">
        <Users className="w-16 h-16 text-blue-300 mx-auto mb-4" />
        <p className="text-blue-600 font-medium">Không có thành viên</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Thành viên gia đình</span>
          </h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            {family.members.length} thành viên
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {family.members.map((member) => (
            <div
              key={member.id}
              className="bg-gradient-to-br from-blue-50/50 to-white border-2 border-blue-200 rounded-xl p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-blue-900 text-lg">{member.name}</h3>
                    {member.role === 'owner' && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
                        Chủ nhóm
                      </span>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColorsLight[member.status] || statusColorsLight.unknown}`}>
                  {statusLabels[member.status] || statusLabels.unknown}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                {member.phone && (
                  <div className="flex items-center gap-2 text-blue-700">
                    <Phone className="w-4 h-4 text-blue-500" />
                    <span className="truncate">{member.phone}</span>
                  </div>
                )}
                {member.location && member.location.lat && member.location.lng ? (
                  <div className="flex items-center gap-2 text-blue-700">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="truncate font-mono text-xs">
                      {member.location.lat.toFixed(6)}, {member.location.lng.toFixed(6)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-xs">Không xác định</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-blue-600">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-xs">
                    {member.lastSeen ? formatRelativeTime(member.lastSeen) : "Không xác định"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Alert */}
      {family.members.some((m) => m.status === 'danger') && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-bold text-red-900">Cảnh báo nguy hiểm</h3>
          </div>
          <p className="text-red-700 text-sm">
            Có {family.members.filter((m) => m.status === 'danger').length} thành viên đang trong vùng nguy hiểm
          </p>
        </div>
      )}
    </div>
  );
}

