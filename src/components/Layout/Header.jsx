import React from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  Navigation,
  Home,
  Users,
  AlertTriangle,
  MapPin,
  LogOut,
  User,
  Bell,
  Loader,
  Clock,
  MapPin as MapPinIcon,
} from "lucide-react";
import {
  getCurrentUser,
  logout,
  isAuthenticated,
} from "../../services/authService";
import { formatRelativeTime } from "../../utils/formatTime";

export default function Header({ sosBellProps = null }) {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Extract SOS bell props if provided
  const {
    nearbySOS = [],
    sosLoading = false,
    showSOSModal = false,
    setShowSOSModal = () => {},
    handleBellClick = () => {},
    handleLocationSelect = () => {},
  } = sosBellProps || {};

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-blue-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="bg-blue-500 p-2 rounded-lg">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-700">StormWatch</h1>
              <p className="text-sm text-blue-600">Giám sát bão lũ cộng đồng</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {authenticated ? (
              <>
                <Link
                  to="/"
                  className="flex items-center gap-2 px-3 py-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Home className="w-5 h-5" />
                  <span className="hidden md:inline">Trang chủ</span>
                </Link>
                <Link
                  to="/reports/create"
                  className="flex items-center gap-2 px-3 py-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <span className="hidden md:inline">Báo cáo</span>
                </Link>
                <Link
                  to="/family"
                  className="flex items-center gap-2 px-3 py-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span className="hidden md:inline">Gia đình</span>
                </Link>
                {/* <Link
                  to="/danger-zones"
                  className="flex items-center gap-2 px-3 py-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  <span className="hidden md:inline">Vùng nguy hiểm</span>
                </Link> */}
                <Link
                  to="/sos"
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="hidden md:inline">SOS</span>
                </Link>
                <div className="flex items-center gap-2 px-3 py-2 text-blue-700">
                  <User className="w-5 h-5" />
                  <span className="hidden md:inline text-sm font-medium">
                    {user?.name || "Người dùng"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-blue-700 hover:text-blue-800 transition-colors font-medium"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Đăng ký
                </Link>
              </>
            )}
            <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 text-sm font-medium hidden md:inline">
                  Live Updates
                </span>
              </div>
            </div>
            {/* SOS Bell - only show if props provided (Home page), positioned at the far right */}
            {sosBellProps && (
              <button
                onClick={handleBellClick}
                disabled={sosLoading}
                className="relative flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Kiểm tra tín hiệu SOS gần đây"
              >
                <Bell
                  className={`w-5 h-5 ${sosLoading ? "animate-spin" : ""}`}
                />
                {nearbySOS.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {nearbySOS.length > 9 ? "9+" : nearbySOS.length}
                  </div>
                )}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>

      {/* SOS Modal - Render outside header using Portal to ensure proper z-index */}
      {sosBellProps &&
        showSOSModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] px-4"
            onClick={() => setShowSOSModal(false)}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl relative z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 border-b-2 border-red-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-7 h-7 text-white" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Tín hiệu SOS gần đây
                      </h2>
                      <p className="text-red-100 text-sm mt-1">
                        Trong bán kính 5km từ vị trí của bạn
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSOSModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {sosLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="w-8 h-8 text-red-500 animate-spin" />
                    <span className="ml-3 text-gray-600">
                      Đang tải tín hiệu SOS...
                    </span>
                  </div>
                ) : nearbySOS.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium">
                      Không có tín hiệu SOS nào trong khu vực
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Các tín hiệu SOS gần đây sẽ hiển thị ở đây
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nearbySOS.map((sos) => (
                      <div
                        key={sos.id || sos._id || sos.alertId}
                        className="bg-red-50 border-2 border-red-200 rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => {
                          // Focus on SOS location on map
                          if (sos.location && handleLocationSelect) {
                            handleLocationSelect(
                              {
                                lat:
                                  sos.location.lat ||
                                  sos.location.coordinates?.[1],
                                lng:
                                  sos.location.lng ||
                                  sos.location.coordinates?.[0],
                                address:
                                  sos.address || sos.Body || "Vị trí SOS",
                              },
                              { fromUser: true }
                            );
                          }
                          setShowSOSModal(false);
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="bg-red-500 rounded-full p-3">
                            <AlertTriangle className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold text-red-700">
                                🚨 Tín hiệu SOS khẩn cấp
                              </h3>
                              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                ACTIVE
                              </span>
                            </div>

                            {(sos.message || sos.body || sos.Body) && (
                              <p className="text-red-800 font-medium mb-3">
                                {sos.message || sos.body || sos.Body}
                              </p>
                            )}

                            <div className="space-y-2 text-sm text-red-700">
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4 text-red-500" />
                                <span>
                                  {sos.address || "Vị trí đã được gửi kèm"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-red-500" />
                                <span>
                                  {formatRelativeTime(
                                    sos.timestamp || new Date()
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {nearbySOS.length > 0 && (
                <div className="bg-red-50 border-t-2 border-red-200 p-4 text-center">
                  <p className="text-red-700 text-sm font-medium">
                    💡 Nhấn vào tín hiệu SOS để xem trên bản đồ
                  </p>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
