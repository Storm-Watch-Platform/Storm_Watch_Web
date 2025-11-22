import React, { useState, useEffect } from "react";
import { X, MapPin, Phone, User, MessageSquare, CheckCircle, PhoneCall } from "lucide-react";
import { sendAlertStatusUpdate, isSTOMPConnected } from "../../services/stompService";

export default function SOSDetailModal({ sos, onClose, onStatusUpdate }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Trigger animation when modal opens
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  const handleMarkAsSolved = async () => {
    // Get alertId - check multiple possible fields
    const alertId = sos?.alertId || sos?.id || sos?.alertID;
    
    if (!sos || !alertId) {
      console.error("❌ [SOS Detail] Missing alertId. SOS object:", sos);
      alert("Thiếu thông tin SOS. Vui lòng thử lại.");
      return;
    }

    // Check if STOMP is connected
    if (!isSTOMPConnected()) {
      console.error("❌ [SOS Detail] STOMP WebSocket not connected");
      alert("WebSocket chưa kết nối. Vui lòng đợi vài giây rồi thử lại.");
      return;
    }

    console.log("🔄 [SOS Detail] Attempting to resolve alert:", alertId);
    console.log("🔄 [SOS Detail] Full SOS object:", sos);
    setIsUpdating(true);
    try {
      await sendAlertStatusUpdate(alertId);
      console.log("✅ [SOS Detail] Alert resolved successfully");
      
      // Notify parent component
      if (onStatusUpdate) {
        onStatusUpdate(alertId, "SOLVED");
      }
      
      // Close modal after successful update
      handleClose();
    } catch (error) {
      console.error("❌ [SOS Detail] Error resolving alert:", error);
      console.error("❌ [SOS Detail] Error details:", error.message, error.stack);
      alert(`Không thể đánh dấu đã hỗ trợ: ${error.message || "Vui lòng thử lại."}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleContact = () => {
    if (sos?.PhoneNumber) {
      window.location.href = `tel:${sos.PhoneNumber}`;
    } else {
      alert("Số điện thoại không có sẵn");
    }
  };

  if (!sos) return null;

  // Get alertId - check multiple possible fields
  const alertId = sos.alertId || sos.id || sos.alertID;
  
  // Debug logging
  useEffect(() => {
    console.log("🔍 [SOS Detail Modal] SOS object:", sos);
    console.log("🔍 [SOS Detail Modal] alertId:", alertId);
    console.log("🔍 [SOS Detail Modal] STOMP connected:", isSTOMPConnected());
  }, [sos, alertId]);

  // Extract location coordinates
  let location = null;
  if (sos.location) {
    if (sos.location.type === "Point" && sos.location.coordinates) {
      location = {
        lat: sos.location.coordinates[1],
        lng: sos.location.coordinates[0],
      };
    } else if (sos.location.lat && sos.location.lng) {
      location = sos.location;
    }
  }

  return (
    <div
      className={`fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 px-4 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all duration-300 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          </div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Chi tiết SOS</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isUpdating}
              className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Name */}
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-lg p-2">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">Tên</p>
              <p className="text-base font-semibold text-gray-900">
                {sos.UserName || "Không có thông tin"}
              </p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-3">
            <div className="bg-green-100 rounded-lg p-2">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">Số điện thoại</p>
              <p className="text-base font-semibold text-gray-900">
                {sos.PhoneNumber || "Không có thông tin"}
              </p>
            </div>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 rounded-lg p-2">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 font-medium">Vị trí</p>
                <p className="text-base font-semibold text-gray-900">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              </div>
            </div>
          )}

          {/* Message */}
          <div className="flex items-start gap-3">
            <div className="bg-orange-100 rounded-lg p-2">
              <MessageSquare className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium mb-1">Lời nhắn</p>
              <p className="text-base text-gray-900 bg-gray-50 rounded-lg p-3 border border-gray-200">
                {sos.Body || sos.body || sos.message || "Không có thông điệp"}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-center pt-2">
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                sos.Status === "SOLVED"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {sos.Status === "SOLVED" ? "Đã xử lý" : "Đang cần hỗ trợ"}
            </span>
          </div>
        </div>

        {/* Actions */}
        {sos.Status !== "SOLVED" && (
          <div className="p-6 pt-0 space-y-3">
            <button
              onClick={handleMarkAsSolved}
              disabled={isUpdating}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <CheckCircle className="w-5 h-5" />
              {isUpdating ? "Đang cập nhật..." : "Đánh dấu đã hỗ trợ"}
            </button>
            <button
              onClick={handleContact}
              disabled={!sos.PhoneNumber || isUpdating}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <PhoneCall className="w-5 h-5" />
              Liên hệ
            </button>
          </div>
        )}

        {sos.Status === "SOLVED" && (
          <div className="p-6 pt-0">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-700 font-semibold">SOS này đã được xử lý</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

