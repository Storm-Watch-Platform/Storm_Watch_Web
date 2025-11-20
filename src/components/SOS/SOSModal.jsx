import React, { useState } from 'react';
import { X, MapPin, Loader, AlertTriangle } from 'lucide-react';

export default function SOSModal({ onClose, onSend, loading, location }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(message);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-slate-900 border border-red-500 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-red-500/20 border-b border-red-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h2 className="text-xl font-bold text-white">Gửi tín hiệu SOS</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
            <p className="text-yellow-200 text-sm">
              <strong>Cảnh báo:</strong> Chỉ sử dụng SOS trong trường hợp khẩn cấp thực sự.
              Tín hiệu sẽ được gửi đến các đội cứu hộ gần nhất.
            </p>
          </div>

          {location && (
            <div className="flex items-start gap-2 p-3 bg-slate-800/50 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-medium">Vị trí của bạn:</p>
                <p className="text-xs text-slate-400 mt-1">
                  {location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
                </p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
              Thông điệp (tùy chọn)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Mô tả tình huống khẩn cấp..."
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  <span>Gửi SOS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

