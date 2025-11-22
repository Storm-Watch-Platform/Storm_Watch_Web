import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  MapPin,
  Loader,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { sendSOS, getActiveSOS } from "../services/sosService";
import { getCurrentUser } from "../services/authService";
import { connectSTOMP } from "../services/stompService";
import { getCurrentPosition } from "../utils/fakeLocation";
import { formatRelativeTime } from "../utils/formatTime";
import Header from "../components/Layout/Header";
import SOSButton from "../components/SOS/SOSButton";
import SOSModal from "../components/SOS/SOSModal";

const SOS_COOLDOWN_SECONDS = 90; // 90 seconds cooldown
const SOS_COOLDOWN_KEY = "sos_last_sent_timestamp";

export default function SOS() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [activeSOS, setActiveSOS] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [stompConnected, setStompConnected] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const user = getCurrentUser();

  // 1. Check login separately
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const getCurrentLocation = useCallback(() => {
    // Sử dụng fakeLocation utility để hỗ trợ test accounts
    getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: "Vị trí hiện tại của bạn",
        });
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Không thể lấy vị trí hiện tại.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  const fetchActiveSOS = useCallback(async () => {
    try {
      const data = await getActiveSOS();
      const userSOS = data.find((sos) => sos.userId === user?.id);
      setActiveSOS(userSOS || null);
    } catch (err) {
      console.error("Fetch active SOS error:", err);
    }
  }, [user?.id]);

  // Format cooldown time for display
  const formatCooldownTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return `${secs}s`;
  }, []);

  // Check cooldown timer
  const checkCooldown = useCallback(() => {
    const lastSentTimestamp = localStorage.getItem(SOS_COOLDOWN_KEY);
    if (!lastSentTimestamp) {
      setCooldownRemaining(0);
      return false; // No cooldown
    }

    const lastSent = parseInt(lastSentTimestamp, 10);
    const now = Date.now();
    const elapsed = Math.floor((now - lastSent) / 1000);
    const remaining = SOS_COOLDOWN_SECONDS - elapsed;

    if (remaining > 0) {
      setCooldownRemaining(remaining);
      return true; // Still in cooldown
    } else {
      setCooldownRemaining(0);
      localStorage.removeItem(SOS_COOLDOWN_KEY);
      return false; // Cooldown expired
    }
  }, []);

  // Update cooldown timer every second
  useEffect(() => {
    checkCooldown(); // Check immediately

    const interval = setInterval(() => {
      const inCooldown = checkCooldown();
      if (!inCooldown) {
        clearInterval(interval);
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [checkCooldown]);

  // 2. Connect STOMP and load data
  useEffect(() => {
    if (user?.id) {
      // Connect STOMP WebSocket
      const userId = user.id || localStorage.getItem("userId");
      if (userId) {
        connectSTOMP(userId)
          .then(() => {
            console.log("[SOS] ✅ STOMP connected");
            setStompConnected(true);
          })
          .catch((err) => {
            console.error("[SOS] ❌ STOMP connection failed:", err);
            setError(
              "Không thể kết nối WebSocket. SOS vẫn có thể gửi qua API."
            );
          });
      }

      // Get location and active SOS
      getCurrentLocation();
      fetchActiveSOS();
    }

    // Cleanup on unmount
    return () => {
      // STOMP sẽ tự disconnect khi cần
    };
  }, [user?.id, fetchActiveSOS, getCurrentLocation]);

  const handleSendSOS = async (message) => {
    if (!userLocation) {
      setError("Không thể lấy vị trí. Vui lòng thử lại.");
      return;
    }

    // Check cooldown before sending
    if (checkCooldown()) {
      setError(
        `Bạn vừa gửi tín hiệu SOS. Vui lòng đợi ${formatCooldownTime(
          cooldownRemaining
        )} trước khi gửi lại để tránh spam.`
      );
      setShowModal(false);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // sendSOS chỉ gửi qua STOMP - Backend tự động lưu vào DB
      if (!stompConnected) {
        setError("WebSocket chưa kết nối. Vui lòng đợi và thử lại.");
        setLoading(false);
        return;
      }

      const sos = await sendSOS(userLocation, message);
      setActiveSOS(sos);

      // Save timestamp to localStorage for cooldown
      localStorage.setItem(SOS_COOLDOWN_KEY, Date.now().toString());
      setCooldownRemaining(SOS_COOLDOWN_SECONDS);

      setSuccess(
        "Đã gửi tín hiệu SOS thành công! Tín hiệu đã được broadcast qua WebSocket và lưu vào hệ thống."
      );
      setShowModal(false);

      // Refresh active SOS list sau khi gửi
      setTimeout(() => {
        fetchActiveSOS();
      }, 1000);
    } catch (err) {
      const errorMsg =
        err.message || "Có lỗi xảy ra khi gửi tín hiệu SOS. Vui lòng thử lại.";
      setError(errorMsg);
      console.error("Send SOS error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-700 mb-2">
            Tín hiệu SOS
          </h1>
          <p className="text-blue-600 text-sm">
            Gửi tín hiệu khẩn cấp để nhận hỗ trợ từ các đội cứu hộ
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-2xl flex items-center gap-3 shadow-md">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-2xl flex items-center gap-3 shadow-md">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* STOMP Connection Status */}
        {stompConnected && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 shadow-md">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-blue-700">
              Đã kết nối WebSocket - Tín hiệu SOS sẽ được broadcast real-time
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* SOS Button Card */}
          <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all">
            <div className="flex flex-col items-center">
              <AlertTriangle className="w-24 h-24 text-red-500 mb-6 animate-pulse" />
              <h2 className="text-2xl font-bold text-blue-700 mb-4">
                Cần hỗ trợ khẩn cấp?
              </h2>
              <p className="text-blue-600 mb-8 max-w-md">
                Nhấn nút bên dưới để gửi tín hiệu SOS. Tín hiệu sẽ được
                broadcast qua WebSocket đến các đội cứu hộ trong bán kính 10km.
              </p>
              <SOSButton
                onClick={() => {
                  // Check cooldown before showing modal
                  if (checkCooldown()) {
                    setError(
                      `Bạn vừa gửi tín hiệu SOS. Vui lòng đợi ${formatCooldownTime(
                        cooldownRemaining
                      )} trước khi gửi lại.`
                    );
                    return;
                  }
                  setShowModal(true);
                }}
                disabled={loading || !!activeSOS || cooldownRemaining > 0}
                active={!!activeSOS}
              />

              {/* Cooldown message */}
              {cooldownRemaining > 0 && (
                <div className="mt-4 p-3 bg-orange-50 border-2 border-orange-300 rounded-xl">
                  <p className="text-orange-700 font-semibold text-base">
                    ⏱️ Cooldown: {formatCooldownTime(cooldownRemaining)}
                  </p>
                  <p className="text-orange-600 text-sm mt-1">
                    Vui lòng đợi trước khi gửi tín hiệu SOS tiếp theo
                  </p>
                </div>
              )}

              {activeSOS && cooldownRemaining === 0 && (
                <p className="mt-4 text-sm text-red-600 font-medium">
                  Tín hiệu SOS đang hoạt động
                </p>
              )}
            </div>
          </div>

          {/* Active SOS Status */}
          {activeSOS && (
            <div className="bg-red-50 border border-red-300 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-semibold text-red-700">
                  Tín hiệu SOS đang hoạt động
                </h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-red-700">
                  <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{activeSOS.address || "Đang xác định..."}</span>
                </div>
                <div className="flex items-center gap-2 text-red-700">
                  <span className="font-medium">Thời gian:</span>
                  <span>{formatRelativeTime(activeSOS.timestamp)}</span>
                </div>
                {activeSOS.message && (
                  <div className="mt-4 p-4 bg-white/80 rounded-xl border border-red-200">
                    <p className="text-red-800 font-medium">Thông điệp:</p>
                    <p className="text-red-700 mt-1">{activeSOS.message}</p>
                  </div>
                )}
                {activeSOS.status === "responded" && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-xl">
                    <p className="text-green-700 font-medium flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Đã có đội cứu hộ phản hồi
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions Card */}
          <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-blue-700 mb-4">
              Hướng dẫn sử dụng
            </h3>
            <ul className="space-y-3 text-blue-600 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span>Chỉ sử dụng SOS trong trường hợp khẩn cấp thực sự</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span>
                  Đảm bảo bạn đã bật định vị GPS để cung cấp vị trí chính xác
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span>
                  Tín hiệu SOS sẽ được broadcast qua WebSocket STOMP đến các đội
                  cứu hộ trong bán kính 10km
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span>
                  Vị trí của bạn sẽ được cập nhật tự động để hỗ trợ tìm kiếm
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 font-bold mt-0.5">•</span>
                <span>
                  Tín hiệu có thời gian sống (TTL) mặc định 5 phút, có thể được
                  gia hạn nếu cần
                </span>
              </li>
            </ul>
          </div>
        </div>

        {showModal && (
          <SOSModal
            onClose={() => setShowModal(false)}
            onSend={handleSendSOS}
            loading={loading}
            location={userLocation}
          />
        )}
      </main>
    </div>
  );
}
