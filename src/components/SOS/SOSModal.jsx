import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader, AlertTriangle, Radio, CheckCircle } from 'lucide-react';

export default function SOSModal({ onClose, onSend, loading, location }) {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation when modal opens
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(message);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 px-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white border-2 border-red-500 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with animated icon */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 border-b-2 border-red-600 p-8 relative overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="relative">
                <AlertTriangle className={`w-14 h-14 text-white ${loading ? 'animate-bounce' : 'animate-pulse'}`} />
                <div className="absolute inset-0 bg-white/30 rounded-full animate-ping opacity-75"></div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Gửi tín hiệu SOS</h2>
                <p className="text-red-100 text-base mt-1.5">Tín hiệu khẩn cấp</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <X className="w-7 h-7 text-white group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-gradient-to-b from-white to-red-50/30">
          {/* Warning Alert */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl p-5 shadow-md animate-pulse-slow">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-base text-yellow-800">
                <p className="font-bold mb-2 text-lg">⚠️ Cảnh báo quan trọng</p>
                <p className="text-yellow-700 leading-relaxed">
                  Chỉ sử dụng SOS trong trường hợp khẩn cấp thực sự. Tín hiệu sẽ được broadcast qua WebSocket đến các đội cứu hộ trong bán kính 10km.
                </p>
              </div>
            </div>
          </div>

          {/* Location Display */}
          {location && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-blue-500 rounded-full p-3">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-blue-900 text-base mb-2">📍 Vị trí hiện tại của bạn</p>
                  <p className="text-blue-700 text-base font-mono bg-white/60 px-4 py-3 rounded-lg border border-blue-200">
                    {location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Message Input */}
          <div>
            <label htmlFor="message" className="block text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              Thông điệp (tùy chọn)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Mô tả tình huống khẩn cấp của bạn...&#10;Ví dụ: Ngập nước cao 1m, cần cứu hộ ngay lập tức!"
              className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 resize-none shadow-sm hover:shadow-md"
              disabled={loading}
            />
            <p className="text-sm text-gray-600 mt-2 font-medium">
              💡 Thông điệp sẽ giúp đội cứu hộ hiểu rõ hơn về tình huống của bạn
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-lg rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              {/* Animated background on hover */}
              <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              
              {/* Button content */}
              <span className="relative z-10 flex items-center gap-3">
                {loading ? (
                  <>
                    <Loader className="w-6 h-6 animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                    <span>Gửi SOS</span>
                  </>
                )}
              </span>
            </button>
          </div>
          
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-3xl">
              <div className="text-center">
                <div className="relative inline-block mb-5">
                  <Loader className="w-16 h-16 text-red-500 animate-spin" />
                  <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                </div>
                <p className="text-red-600 font-bold text-xl mb-2">Đang gửi tín hiệu SOS...</p>
                <p className="text-gray-600 text-base font-medium">Vui lòng chờ trong giây lát</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

