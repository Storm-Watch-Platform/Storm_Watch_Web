import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  MapPin,
  Loader,
  AlertCircle,
  X,
  Camera,
  Cloud,
  Route,
  Package,
  Shield,
} from "lucide-react";
import { analyzeImage } from "../services/reportService";
import {
  connectSTOMP,
  sendReport,
  isSTOMPConnected,
} from "../services/stompService";
import Header from "../components/Layout/Header";

const REPORT_CATEGORIES = [
  {
    id: "weather-nature",
    label: "Thời tiết và thiên nhiên",
    icon: Cloud,
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconColor: "text-blue-500",
    selectedBg: "bg-blue-100",
    selectedBorder: "border-blue-400",
    options: [
      "Mưa lớn",
      "Gió mạnh",
      "Sương mù dày đặc",
      "Nhiệt độ cực đoan",
      "Lũ quét",
      "Sạt lở đất",
      "Khác",
    ],
  },
  {
    id: "infrastructure-traffic",
    label: "Hạ tầng và giao thông",
    icon: Route,
    color: "orange",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    iconColor: "text-orange-500",
    selectedBg: "bg-orange-100",
    selectedBorder: "border-orange-400",
    options: [
      "Đường bị sạt lở",
      "Cầu bị hư hỏng",
      "Đường ngập nước",
      "Cây đổ chặn đường",
      "Điện bị cắt",
      "Nước bị cắt",
      "Khác",
    ],
  },
  {
    id: "logistics-survival",
    label: "Hậu cần và sinh tồn",
    icon: Package,
    color: "purple",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    iconColor: "text-purple-500",
    selectedBg: "bg-purple-100",
    selectedBorder: "border-purple-400",
    options: [
      "Thiếu lương thực",
      "Thiếu nước sạch",
      "Thiếu thuốc men",
      "Thiếu nhiên liệu",
      "Chợ/siêu thị đóng cửa",
      "Dịch vụ y tế không hoạt động",
      "Khác",
    ],
  },
  {
    id: "safety-health",
    label: "An toàn và sức khoẻ",
    icon: Shield,
    color: "red",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconColor: "text-red-500",
    selectedBg: "bg-red-100",
    selectedBorder: "border-red-400",
    options: [
      "Ô nhiễm không khí",
      "Nước bị ô nhiễm",
      "Dịch bệnh",
      "Động vật nguy hiểm",
      "Khu vực không an toàn",
      "Thiếu thiết bị y tế",
      "Khác",
    ],
  },
];

const SEVERITY_LEVELS = [
  { id: "low", label: "Thấp", color: "yellow" },
  { id: "medium", label: "Trung bình", color: "orange" },
  { id: "high", label: "Cao", color: "red" },
];

export default function ReportCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: "",
    subCategory: "",
    customSubCategory: "",
    severity: "medium",
    description: "",
    location: null,
    address: "",
  });
  const [images, setImages] = useState([]);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Map category ID to STOMP type (uppercase with underscore)
  const CATEGORY_TYPE_MAP = {
    "weather-nature": "WEATHER_NATURE",
    "infrastructure-traffic": "INFRASTRUCTURE_TRAFFIC",
    "logistics-survival": "LOGISTICS_SURVIVAL",
    "safety-health": "SAFETY_HEALTH",
  };

  // Convert image file to Base64 (normalized)
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // Remove "data:image/...;base64," prefix
          const base64 = e.target.result.split(",")[1];
          // Normalize Base64 to remove NULL bytes (critical fix from HTML demo)
          const normalized = btoa(atob(base64));
          resolve(normalized);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Connect STOMP when component mounts
  useEffect(() => {
    const initSTOMP = async () => {
      // Get userId from localStorage (saved from login/register response)
      const userId = localStorage.getItem("userId");

      if (!userId) {
        console.warn(
          "[ReportCreate] No userId found, skipping STOMP connection"
        );
        return;
      }

      try {
        if (!isSTOMPConnected()) {
          console.log(
            "[ReportCreate] Connecting to STOMP with userId:",
            userId
          );
          await connectSTOMP(userId);
        }
      } catch (error) {
        console.error("[ReportCreate] Error connecting STOMP:", error);
      }
    };

    initSTOMP();

    // Cleanup: disconnect on unmount
    return () => {
      // Don't disconnect here - keep connection alive for other components
      // disconnectSTOMP();
    };
  }, []);

  const handleCategorySelect = (categoryId) => {
    setFormData({
      ...formData,
      category: categoryId,
      subCategory: "",
      customSubCategory: "",
    });
  };

  const handleSubCategorySelect = (subCategory) => {
    if (subCategory === "Khác") {
      setFormData({ ...formData, subCategory: "other", customSubCategory: "" });
    } else {
      setFormData({ ...formData, subCategory, customSubCategory: "" });
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random(),
    }));

    setImages([...images, ...newImages]);

    // Analyze first image
    if (files[0] && !imageAnalysis) {
      setAnalyzing(true);
      try {
        const analysis = await analyzeImage(files[0]);
        setImageAnalysis(analysis);
        if (analysis.suggested_category && !formData.category) {
          setFormData({ ...formData, category: analysis.suggested_category });
        }
      } catch (err) {
        console.error("Image analysis error:", err);
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleRemoveImage = (imageId) => {
    setImages(images.filter((img) => img.id !== imageId));
    if (images.length === 1) {
      setImageAnalysis(null);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ xác định vị trí.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setFormData({
          ...formData,
          location,
          address: "Đang xác định địa chỉ...",
        });
        setLoading(false);

        // Reverse geocode (simplified - in real app use Google Geocoding API)
        setFormData((prev) => ({
          ...prev,
          address: `Vị trí: ${location.lat.toFixed(6)}, ${location.lng.toFixed(
            6
          )}`,
        }));
      },
      () => {
        setError("Không thể lấy vị trí. Vui lòng thử lại.");
        setLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.category) {
      setError("Vui lòng chọn loại báo cáo.");
      return;
    }

    if (!formData.subCategory) {
      setError("Vui lòng chọn vấn đề cụ thể.");
      return;
    }

    if (
      formData.subCategory === "other" &&
      !formData.customSubCategory.trim()
    ) {
      setError('Vui lòng nhập mô tả vấn đề khi chọn "Khác".');
      return;
    }

    if (!formData.location) {
      setError("Vui lòng lấy vị trí hiện tại.");
      return;
    }

    if (images.length === 0) {
      setError("Vui lòng tải lên ít nhất một hình ảnh.");
      return;
    }

    setLoading(true);
    try {
      // Ensure STOMP is connected
      if (!isSTOMPConnected()) {
        const userId = localStorage.getItem("userId");
        if (userId) {
          try {
            await connectSTOMP(userId);
            // Wait a bit for connection to establish
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (error) {
            console.error("Error connecting STOMP:", error);
          }
        }

        if (!isSTOMPConnected()) {
          setError("Không thể kết nối đến server. Vui lòng thử lại.");
          setLoading(false);
          return;
        }
      }

      // Convert first image to Base64
      let imageBase64 = "";
      if (images.length > 0 && images[0].file) {
        try {
          imageBase64 = await convertImageToBase64(images[0].file);
        } catch (error) {
          console.error("Error converting image to Base64:", error);
          setError("Lỗi khi xử lý hình ảnh. Vui lòng thử lại.");
          setLoading(false);
          return;
        }
      }

      // Map category to STOMP type
      const type =
        CATEGORY_TYPE_MAP[formData.category] || formData.category.toUpperCase();

      // Get detail (sub-category)
      const detail =
        formData.subCategory === "other"
          ? formData.customSubCategory
          : formData.subCategory;

      // Prepare STOMP report data (all lowercase keys as per backend)
      const reportData = {
        type: type, // e.g., "WEATHER_NATURE"
        detail: detail, // e.g., "Mưa lớn"
        description: formData.description || "", // Full description
        image: imageBase64, // Base64 encoded image
        lat: formData.location.lat, // Latitude
        lon: formData.location.lng, // Longitude
        timestamp: Date.now(), // Timestamp
      };

      // Send report via STOMP
      await sendReport(reportData);

      // Show success message
      setError(""); // Clear any previous errors

      // Navigate to home or show success
      // Note: STOMP doesn't return report ID, so we navigate to home
      // In production, backend might send confirmation via STOMP message
      navigate("/", {
        state: {
          message: "Báo cáo đã được gửi thành công!",
          type: "success",
        },
      });
    } catch (err) {
      setError(
        err.message || "Có lỗi xảy ra khi tạo báo cáo. Vui lòng thử lại."
      );
      console.error("Create report error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-blue-900">Báo cáo vấn đề</h1>
          </div>
          <p className="text-slate-600 text-sm ml-14">
            Chia sẻ thông tin để cộng đồng được an toàn hơn
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg shadow-md flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {imageAnalysis && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg shadow-md">
            <p className="text-blue-700 text-sm">
              <strong>Phân tích ảnh:</strong> Phát hiện{" "}
              {imageAnalysis.detected?.[0]?.label || "đối tượng"}
              {imageAnalysis.suggested_category &&
                ` - Đề xuất: ${
                  REPORT_CATEGORIES.find(
                    (c) => c.id === imageAnalysis.suggested_category
                  )?.label || imageAnalysis.suggested_category
                }`}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          {!formData.category ? (
            <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-6 shadow-lg">
              <label className="block text-sm font-semibold text-blue-900 mb-2">
                Chọn loại vấn đề <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-600 mb-4">
                Báo cáo các vấn đề bạn gặp phải (không quá nghiêm trọng để nhấn
                SOS)
              </p>
              <div className="grid grid-cols-1 gap-3">
                {REPORT_CATEGORIES.map((cat) => {
                  const IconComponent = cat.icon;

                  const getArrowColor = () => {
                    switch (cat.color) {
                      case "blue":
                        return "text-blue-400";
                      case "orange":
                        return "text-orange-400";
                      case "purple":
                        return "text-purple-400";
                      case "red":
                        return "text-red-400";
                      default:
                        return "text-slate-400";
                    }
                  };

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left bg-white ${cat.borderColor} hover:shadow-md`}
                    >
                      <div className={`p-3 rounded-lg ${cat.bgColor}`}>
                        <IconComponent className={`w-6 h-6 ${cat.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-700">
                          {cat.label}
                        </div>
                      </div>
                      <div className={getArrowColor()}>→</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Selected Category Card */}
              {(() => {
                const selectedCat = REPORT_CATEGORIES.find(
                  (c) => c.id === formData.category
                );
                if (!selectedCat) return null;
                const IconComponent = selectedCat.icon;
                const getTextColor = () => {
                  switch (selectedCat.color) {
                    case "blue":
                      return "text-blue-900";
                    case "orange":
                      return "text-orange-900";
                    case "purple":
                      return "text-purple-900";
                    case "red":
                      return "text-red-900";
                    default:
                      return "text-slate-700";
                  }
                };
                return (
                  <div
                    className={`bg-white/90 backdrop-blur-md border-2 ${selectedCat.selectedBorder} rounded-2xl p-6 shadow-lg ${selectedCat.selectedBg}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`p-3 rounded-lg ${selectedCat.bgColor}`}
                        >
                          <IconComponent
                            className={`w-6 h-6 ${selectedCat.iconColor}`}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold text-lg ${getTextColor()}`}>
                            {selectedCat.label}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1">
                            Mô tả chi tiết vấn đề bạn gặp phải
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCategorySelect("")}
                        className="p-2 hover:bg-white/50 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5 text-slate-500" />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Sub-category Selection */}
              {(() => {
                const selectedCat = REPORT_CATEGORIES.find(
                  (c) => c.id === formData.category
                );
                if (!selectedCat) return null;

                const getButtonClasses = (option) => {
                  const isSelected =
                    formData.subCategory === option ||
                    (option === "Khác" && formData.subCategory === "other");
                  const baseClasses =
                    "px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium";

                  if (isSelected) {
                    switch (selectedCat.color) {
                      case "blue":
                        return `${baseClasses} bg-blue-100 border-blue-400 text-blue-900`;
                      case "orange":
                        return `${baseClasses} bg-orange-100 border-orange-400 text-orange-900`;
                      case "purple":
                        return `${baseClasses} bg-purple-100 border-purple-400 text-purple-900`;
                      case "red":
                        return `${baseClasses} bg-red-100 border-red-400 text-red-900`;
                      default:
                        return `${baseClasses} bg-blue-100 border-blue-400 text-blue-900`;
                    }
                  }
                  return `${baseClasses} bg-white border-blue-200 text-slate-700 hover:border-blue-300`;
                };

                return (
                  <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-6 shadow-lg">
                    <label className="block text-sm font-semibold text-blue-900 mb-3">
                      Vấn đề cụ thể <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedCat.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleSubCategorySelect(option)}
                          className={getButtonClasses(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>

                    {/* Custom input for "Khác" */}
                    {formData.subCategory === "other" && (
                      <div className="mt-4">
                        <input
                          type="text"
                          value={formData.customSubCategory}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customSubCategory: e.target.value,
                            })
                          }
                          placeholder="Nhập mô tả vấn đề..."
                          className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}

          {/* Severity Selection */}
          {/* <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-6 shadow-lg">
              <label className="block text-sm font-semibold text-blue-900 mb-3">
                Mức độ nghiêm trọng
              </label>
              <div className="flex gap-3">
                {SEVERITY_LEVELS.map((sev) => {
                  const isSelected = formData.severity === sev.id;
                  const getSeverityClasses = () => {
                    if (!isSelected)
                      return {
                        border: "border-blue-200",
                        bg: "bg-white",
                        text: "text-slate-600",
                      };
                    switch (sev.color) {
                      case "yellow":
                        return {
                          border: "border-yellow-400",
                          bg: "bg-yellow-50",
                          text: "text-yellow-600",
                        };
                      case "orange":
                        return {
                          border: "border-orange-400",
                          bg: "bg-orange-50",
                          text: "text-orange-600",
                        };
                      case "red":
                        return {
                          border: "border-red-400",
                          bg: "bg-red-50",
                          text: "text-red-600",
                        };
                      default:
                        return {
                          border: "border-blue-200",
                          bg: "bg-white",
                          text: "text-slate-600",
                        };
                    }
                  };
                  const classes = getSeverityClasses();
                  return (
                    <button
                      key={sev.id}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, severity: sev.id })
                      }
                      className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? `${classes.border} ${classes.bg} shadow-md`
                          : `${classes.border} ${classes.bg} hover:border-blue-300`
                      }`}
                    >
                      <div className={`${classes.text} font-semibold`}>
                        {sev.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div> */}

          {/* Image Upload */}
          <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-6 shadow-lg">
            <label className="block text-sm font-semibold text-blue-900 mb-3">
              Hình ảnh <span className="text-red-500">*</span>
            </label>
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer bg-blue-50/50 hover:bg-blue-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {analyzing ? (
                    <Loader className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                  ) : (
                    <Camera className="w-8 h-8 text-blue-500 mb-2" />
                  )}
                  <p className="mb-2 text-sm text-blue-700">
                    {analyzing
                      ? "Đang phân tích ảnh..."
                      : "Nhấn để tải ảnh lên"}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={analyzing}
                />
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-xl border border-blue-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-6 shadow-lg">
            <label className="block text-sm font-semibold text-blue-900 mb-3">
              Vị trí <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                <MapPin className="w-5 h-5" />
                {loading ? "Đang lấy vị trí..." : "Lấy vị trí hiện tại"}
              </button>
              {formData.address && (
                <p className="text-slate-700 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                  {formData.address}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-6 shadow-lg">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-blue-900 mb-3"
            >
              Mô tả
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
              placeholder="Mô tả chi tiết tình huống..."
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-blue-200 rounded-xl transition-colors shadow-md hover:shadow-lg font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                "Tạo báo cáo"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
