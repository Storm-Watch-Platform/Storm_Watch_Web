import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Loader,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Map,
  List,
} from "lucide-react";
import {
  getAllFamilies,
  createFamily,
  joinGroup,
} from "../services/familyService";
import { getCurrentUser } from "../services/authService";
import Header from "../components/Layout/Header";
import FamilyPanel from "../components/Family/FamilyPanel";
import FamilyMapView from "../components/Family/FamilyMapView";

export default function Family() {
  const navigate = useNavigate();
  const [family, setFamily] = useState(null);
  const [families, setFamilies] = useState([]); // All groups
  const [selectedFamilyId, setSelectedFamilyId] = useState(null); // Currently selected group ID
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("view"); // 'view', 'create' or 'join'
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'map'
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [createdInviteCode, setCreatedInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Get user once and check if exists
  const user = getCurrentUser();
  const userId = user?.id || localStorage.getItem("userId");
  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");

  // Load Google Maps API for map view
  useEffect(() => {
    if (viewMode !== "map") return; // Only load when map view is active

    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_MAPS_API_KEY) {
      setMapError(
        "VITE_GOOGLE_MAPS_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env"
      );
      return;
    }

    // Check if already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.google && window.google.maps) {
          setMapLoaded(true);
        }
      });
      return;
    }

    // Create script tag
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
      }
    };

    script.onerror = () => {
      setMapError(
        "Không thể tải Google Maps API. Vui lòng kiểm tra API key và kết nối mạng."
      );
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [viewMode]);

  // Fetch family only once on mount
  useEffect(() => {
    // Check if user is logged in
    if (!userId || !token) {
      navigate("/login");
      return;
    }

    // Check if token is valid format (JWT has 3 parts separated by dots)
    const tokenParts = (token || "").split(".");
    if (tokenParts.length !== 3 || tokenParts.some((part) => !part)) {
      console.warn("⚠️ [Family] Invalid token format, redirecting to login");
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      navigate("/login");
      return;
    }

    // Fetch family data once
    let isMounted = true;

    const fetchFamilies = async () => {
      try {
        setLoading(true);
        setError("");
        const allFamilies = await getAllFamilies();
        if (isMounted) {
          setFamilies(allFamilies);
          // Set first family as selected if available
          if (allFamilies.length > 0) {
            setSelectedFamilyId(allFamilies[0].id);
            setFamily(allFamilies[0]);
          } else {
            setSelectedFamilyId(null);
            setFamily(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          // If error is about authentication, redirect to login
          if (
            err.message?.includes("token") ||
            err.message?.includes("401") ||
            err.message?.includes("403")
          ) {
            console.warn(
              "⚠️ [Family] Authentication error, redirecting to login"
            );
            localStorage.removeItem("token");
            localStorage.removeItem("accessToken");
            navigate("/login");
            return;
          }
          setError(err.message || "Có lỗi xảy ra khi tải thông tin gia đình");
          console.error("Fetch families error:", err);
          setFamilies([]);
          setFamily(null);
          setSelectedFamilyId(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFamilies();

    // Cleanup to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleCreateFamily = async (e) => {
    e?.preventDefault();
    if (!user) return;

    if (!groupName.trim()) {
      setError("Vui lòng nhập tên nhóm");
      return;
    }

    setCreating(true);
    setError("");
    try {
      // Step 1: Create the group
      const newFamily = await createFamily({
        name: groupName.trim(),
      });

      // Step 2: Automatically join the user to the created group using inviteCode
      if (newFamily.inviteCode) {
        console.log(
          `🔄 [Family] Auto-joining group with invite code: ${newFamily.inviteCode}`
        );
        try {
          const joinedFamily = await joinGroup(newFamily.inviteCode);
          console.log("✅ [Family] Successfully joined created group");

          // Refresh all families to get updated list
          const allFamilies = await getAllFamilies();
          setFamilies(allFamilies);
          // Find and select the joined family
          const joinedFamilyFromList =
            allFamilies.find((f) => f.id === joinedFamily.id) || joinedFamily;
          setFamily(joinedFamilyFromList);
          setSelectedFamilyId(joinedFamilyFromList.id);
          // Clear createdInviteCode since we've successfully joined and will show in view tab
          setCreatedInviteCode("");

          // Switch to view tab to show the group
          setActiveTab("view");
        } catch (joinErr) {
          console.warn(
            "⚠️ [Family] Failed to auto-join group, but group was created:",
            joinErr
          );
          // Group was created but join failed - show invite code so user can manually join
          setFamily(null); // Don't set family since join failed
          setCreatedInviteCode(newFamily.inviteCode);
          setError(
            `Nhóm đã được tạo nhưng có lỗi khi tham gia: ${
              joinErr.message || "Vui lòng thử tham gia lại bằng mã mời"
            }`
          );
        }
      } else {
        // No invite code, just set the family
        setFamily(newFamily);
        setCreatedInviteCode("");
      }

      setGroupName("");
    } catch (err) {
      // Handle authentication errors
      if (
        err.message?.includes("đăng nhập") ||
        err.message?.includes("token")
      ) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("accessToken");
          navigate("/login");
        }, 2000);
      } else {
        setError(err.message || "Có lỗi xảy ra khi tạo nhóm gia đình");
      }
      console.error("Create family error:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e?.preventDefault();
    if (!user) return;

    if (!inviteCode.trim()) {
      setError("Vui lòng nhập mã mời");
      return;
    }

    setJoining(true);
    setError("");
    try {
      const joinedFamily = await joinGroup(inviteCode.trim());
      // Refresh all families to get updated list
      const allFamilies = await getAllFamilies();
      setFamilies(allFamilies);
      // Find and select the joined family
      const joinedFamilyFromList =
        allFamilies.find((f) => f.id === joinedFamily.id) || joinedFamily;
      setFamily(joinedFamilyFromList);
      setSelectedFamilyId(joinedFamilyFromList.id);
      setInviteCode("");
      // Switch to view tab to show the joined group
      setActiveTab("view");
    } catch (err) {
      // Handle authentication errors
      if (
        err.message?.includes("đăng nhập") ||
        err.message?.includes("token")
      ) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("accessToken");
          navigate("/login");
        }, 2000);
      } else {
        setError(
          err.message ||
            "Có lỗi xảy ra khi tham gia nhóm. Vui lòng kiểm tra mã mời."
        );
      }
      console.error("Join group error:", err);
    } finally {
      setJoining(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (createdInviteCode) {
      navigator.clipboard.writeText(createdInviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefreshFamily = async () => {
    if (!userId || !token) return;

    setLoading(true);
    setError("");
    try {
      const allFamilies = await getAllFamilies();
      setFamilies(allFamilies);
      if (allFamilies.length > 0) {
        // Keep current selection if it still exists, otherwise select first
        const currentFamily = allFamilies.find(
          (f) => f.id === selectedFamilyId
        );
        if (currentFamily) {
          setFamily(currentFamily);
        } else {
          setSelectedFamilyId(allFamilies[0].id);
          setFamily(allFamilies[0]);
        }
      } else {
        setFamily(null);
        setSelectedFamilyId(null);
        setError("Không tìm thấy nhóm gia đình");
      }
    } catch (err) {
      if (
        err.message?.includes("token") ||
        err.message?.includes("401") ||
        err.message?.includes("403")
      ) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("accessToken");
          navigate("/login");
        }, 2000);
      } else {
        setError(err.message || "Có lỗi xảy ra khi tải thông tin gia đình");
      }
      console.error("Refresh family error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFamily = (familyId) => {
    const selectedFamily = families.find((f) => f.id === familyId);
    if (selectedFamily) {
      setSelectedFamilyId(familyId);
      setFamily(selectedFamily);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
        <Header />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader className="w-8 h-8 text-blue-500 animate-spin" />
        </main>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-8">
            <Users className="w-20 h-20 text-blue-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-blue-800 mb-2">
              Chưa có nhóm gia đình
            </h1>
            <p className="text-blue-600">
              Tạo nhóm mới hoặc tham gia nhóm bằng mã mời
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white/90 backdrop-blur-md rounded-lg p-1 mb-6 flex gap-2 shadow-md border border-blue-200">
            <button
              onClick={() => {
                setActiveTab("create");
                setError("");
                setGroupName("");
                setInviteCode("");
                setCreatedInviteCode(""); // Clear invite code when switching tabs
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === "create"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-blue-700 hover:text-blue-800 hover:bg-blue-50"
              }`}
            >
              Tạo nhóm mới
            </button>
            <button
              onClick={() => {
                setActiveTab("join");
                setError("");
                setGroupName("");
                setInviteCode("");
                setCreatedInviteCode(""); // Clear invite code when switching tabs
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === "join"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-blue-700 hover:text-blue-800 hover:bg-blue-50"
              }`}
            >
              Tham gia nhóm
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3 shadow-md">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Create Group Form */}
          {activeTab === "create" && (
            <div className="bg-white/90 backdrop-blur-md rounded-lg p-6 border border-blue-200 shadow-lg">
              <form onSubmit={handleCreateFamily} className="space-y-4">
                <div>
                  <label
                    htmlFor="groupName"
                    className="block text-sm font-medium text-blue-800 mb-2"
                  >
                    Tên nhóm gia đình
                  </label>
                  <input
                    id="groupName"
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ví dụ: Gia đình nhà tôi"
                    className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={creating}
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating || !groupName.trim()}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                >
                  {creating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Tạo nhóm</span>
                    </>
                  )}
                </button>
              </form>

              {/* Invite Code Display (after creation) */}
              {createdInviteCode && (
                <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded-lg shadow-md">
                  <p className="text-green-800 text-sm font-medium mb-2">
                    ✅ Nhóm đã được tạo thành công!
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-blue-800 text-sm font-medium">
                      Mã mời:
                    </label>
                    <div className="flex-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg font-mono text-blue-900 text-lg font-bold">
                      {createdInviteCode}
                    </div>
                    <button
                      onClick={handleCopyInviteCode}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-md"
                      title="Sao chép mã mời"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="text-sm">Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="text-sm">Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-blue-600 text-xs mt-2">
                    Chia sẻ mã này với các thành viên để họ có thể tham gia nhóm
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Join Group Form */}
          {activeTab === "join" && (
            <div className="bg-white/90 backdrop-blur-md rounded-lg p-6 border border-blue-200 shadow-lg">
              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div>
                  <label
                    htmlFor="inviteCode"
                    className="block text-sm font-medium text-blue-800 mb-2"
                  >
                    Mã mời
                  </label>
                  <input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) =>
                      setInviteCode(e.target.value.toUpperCase())
                    }
                    placeholder="Nhập mã mời (ví dụ: 37FFAB)"
                    className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                    style={{ textTransform: "uppercase" }}
                    disabled={joining}
                    maxLength={10}
                  />
                  <p className="text-blue-600 text-xs mt-2">
                    Nhập mã mời mà bạn nhận được từ người tạo nhóm
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={joining || !inviteCode.toUpperCase().trim()}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                >
                  {joining ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Đang tham gia...</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5" />
                      <span>Tham gia nhóm</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Tab Navigation - View/Create/Join */}
        <div className="bg-white/90 backdrop-blur-md rounded-lg p-1 flex gap-2 shadow-lg border border-blue-200">
          <button
            onClick={() => {
              setActiveTab("view");
              setError("");
              handleRefreshFamily();
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "view"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-blue-700 hover:text-blue-800 hover:bg-blue-50"
            }`}
          >
            <Eye className="w-5 h-5" />
            <span>Xem nhóm</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("create");
              setError("");
              setGroupName("");
              setInviteCode("");
              setCreatedInviteCode(""); // Clear invite code when switching tabs
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "create"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-blue-700 hover:text-blue-800 hover:bg-blue-50"
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>Tạo nhóm mới</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("join");
              setError("");
              setGroupName("");
              setInviteCode("");
              setCreatedInviteCode(""); // Clear invite code when switching tabs
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "join"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-blue-700 hover:text-blue-800 hover:bg-blue-50"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Tham gia nhóm</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3 shadow-md">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* View Group Tab */}
        {activeTab === "view" && (
          <>
            {/* Groups List - Show if user has multiple groups */}
            {families.length > 1 && (
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-5 border border-blue-200 shadow-lg mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Danh sách nhóm
                  </h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {families.length} nhóm
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {families.map((fam) => (
                    <button
                      key={fam.id}
                      onClick={() => handleSelectFamily(fam.id)}
                      className={`px-4 py-2.5 rounded-lg border-2 transition-all flex items-center gap-2 ${
                        selectedFamilyId === fam.id
                          ? "border-blue-600 bg-blue-50 shadow-md"
                          : "border-blue-200 bg-white hover:border-blue-400 hover:shadow-sm"
                      }`}
                    >
                      <span className="font-semibold text-blue-900">
                        {fam.name}
                      </span>
                      {selectedFamilyId === fam.id && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main Content - 2 Column Layout */}
            {family && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Left Column - Group Info Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-blue-200 shadow-lg">
                    {/* Group Header */}
                    <div className="mb-6">
                      <h1 className="text-2xl font-bold text-blue-900 mb-2">
                        {family.name}
                      </h1>
                      <div className="flex items-center gap-2 text-blue-600">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">
                          {family.members?.length ||
                            family.memberIDs?.length ||
                            0}{" "}
                          thành viên
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 mb-6">
                      <button
                        onClick={handleRefreshFamily}
                        disabled={loading}
                        className="w-full px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                        />
                        <span>Làm mới</span>
                      </button>
                      {/* <button
                        onClick={() => navigate("/family/members")}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg font-semibold"
                      >
                        <span>Quản lý thành viên</span>
                        <ArrowRight className="w-4 h-4" />
                      </button> */}
                    </div>

                    {/* Group Info */}
                    <div className="space-y-4 pt-6 border-t border-blue-200">
                      <div>
                        <p className="text-xs text-blue-600 uppercase tracking-wider mb-1.5 font-semibold">
                          Mã mời
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-lg font-bold text-blue-900 font-mono text-center">
                            {family.inviteCode || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 uppercase tracking-wider mb-1.5 font-semibold">
                          Ngày tạo
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm font-semibold text-blue-900 text-center">
                            {family.createdAt
                              ? new Date(family.createdAt).toLocaleDateString(
                                  "vi-VN",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  }
                                )
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Members List or Map */}
                <div className="lg:col-span-2">
                  {/* View Mode Toggle */}
                  <div className="mb-4 flex gap-2">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                        viewMode === "list"
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      <List className="w-4 h-4" />
                      <span>Danh sách</span>
                    </button>
                    <button
                      onClick={() => setViewMode("map")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                        viewMode === "map"
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      <Map className="w-4 h-4" />
                      <span>Bản đồ</span>
                    </button>
                  </div>

                  {/* List View */}
                  {viewMode === "list" && <FamilyPanel family={family} />}

                  {/* Map View */}
                  {viewMode === "map" && (
                    <div>
                      {mapError && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                          <p className="text-red-700 text-sm">{mapError}</p>
                        </div>
                      )}
                      {!mapLoaded && !mapError && (
                        <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-12 text-center shadow-lg">
                          <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                          <p className="text-blue-700">Đang tải bản đồ...</p>
                        </div>
                      )}
                      {mapLoaded && (
                        <FamilyMapView
                          mapLoaded={mapLoaded}
                          members={family.members || []}
                          currentUserId={userId}
                          onMemberClick={(member) => {
                            console.log("Member clicked:", member);
                            // You can add more actions here, like showing member details
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Show message if no family selected */}
            {!family && families.length === 0 && (
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 text-center border border-blue-200 shadow-lg">
                <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-blue-800 mb-2">
                  Chưa có nhóm gia đình
                </h2>
                <p className="text-blue-600 mb-6">
                  Bạn chưa tham gia nhóm gia đình nào. Hãy tạo nhóm mới hoặc
                  tham gia nhóm bằng mã mời.
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setActiveTab("create")}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-md"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Tạo nhóm mới</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("join")}
                    className="px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg transition-colors flex items-center gap-2 shadow-md"
                  >
                    <Users className="w-5 h-5" />
                    <span>Tham gia nhóm</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Show message if no family when viewing */}
        {activeTab === "view" && !family && (
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 text-center border border-blue-200 shadow-lg">
            <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-blue-800 mb-2">
              Chưa có nhóm gia đình
            </h2>
            <p className="text-blue-600 mb-6">
              Bạn chưa tham gia nhóm gia đình nào. Hãy tạo nhóm mới hoặc tham
              gia nhóm bằng mã mời.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setActiveTab("create")}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span>Tạo nhóm mới</span>
              </button>
              <button
                onClick={() => setActiveTab("join")}
                className="px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg transition-colors flex items-center gap-2 shadow-md"
              >
                <Users className="w-5 h-5" />
                <span>Tham gia nhóm</span>
              </button>
            </div>
          </div>
        )}

        {/* Create Group Form - when family exists */}
        {activeTab === "create" && (
          <div className="bg-white/90 backdrop-blur-md rounded-lg p-6 border border-blue-200 shadow-lg">
            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div>
                <label
                  htmlFor="groupName"
                  className="block text-sm font-medium text-blue-800 mb-2"
                >
                  Tên nhóm gia đình
                </label>
                <input
                  id="groupName"
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ví dụ: Gia đình nhà tôi"
                  className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={creating}
                />
              </div>
              <button
                type="submit"
                disabled={creating || !groupName.trim()}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {creating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Tạo nhóm</span>
                  </>
                )}
              </button>
            </form>

            {/* Invite Code Display (after creation) */}
            {createdInviteCode && (
              <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded-lg shadow-md">
                <p className="text-green-800 text-sm font-medium mb-2">
                  ✅ Nhóm đã được tạo thành công!
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-blue-800 text-sm font-medium">
                    Mã mời:
                  </label>
                  <div className="flex-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg font-mono text-blue-900 text-lg font-bold">
                    {createdInviteCode}
                  </div>
                  <button
                    onClick={handleCopyInviteCode}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-md"
                    title="Sao chép mã mời"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="text-sm">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-sm">Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-blue-600 text-xs mt-2">
                  Chia sẻ mã này với các thành viên để họ có thể tham gia nhóm
                </p>
              </div>
            )}
          </div>
        )}

        {/* Join Group Form - when family exists */}
        {activeTab === "join" && (
          <div className="bg-white/90 backdrop-blur-md rounded-lg p-6 border border-blue-200 shadow-lg">
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label
                  htmlFor="inviteCode"
                  className="block text-sm font-medium text-blue-800 mb-2"
                >
                  Mã mời
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã mời (ví dụ: 37FFAB)"
                  className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                  style={{ textTransform: "uppercase" }}
                  disabled={joining}
                  maxLength={10}
                />
                <p className="text-blue-600 text-xs mt-2">
                  Nhập mã mời mà bạn nhận được từ người tạo nhóm
                </p>
              </div>
              <button
                type="submit"
                disabled={joining || !inviteCode.toUpperCase().trim()}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {joining ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Đang tham gia...</span>
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5" />
                    <span>Tham gia nhóm</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
