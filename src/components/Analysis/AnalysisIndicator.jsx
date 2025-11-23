import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useAnalysis } from "../../contexts/AnalysisContext";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Sparkles,
  Loader,
} from "lucide-react";

export default function AnalysisIndicator() {
  const { analysisResult, isAnalyzing, clearAnalysis } = useAnalysis();
  const [showModal, setShowModal] = useState(false);

  // Show loading indicator when analyzing
  if (isAnalyzing) {
    return (
      <div className="relative flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg shadow-md">
        <Loader className="w-5 h-5 animate-spin" />
        <span className="hidden md:inline text-sm font-medium">
          Đang phân tích...
        </span>
        {/* Pulse animation */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping opacity-75"></div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"></div>
      </div>
    );
  }

  if (!analysisResult) {
    return null; // Don't show anything if no analysis result
  }

  const { severity, cause, current_status, recommendation } = analysisResult;

  // Determine icon and color based on severity
  const getSeverityConfig = () => {
    const severityUpper = (severity || "").toUpperCase();
    switch (severityUpper) {
      case "HIGH":
        return {
          icon: AlertTriangle,
          bgColor: "bg-red-500",
          hoverBgColor: "hover:bg-red-600",
          textColor: "text-red-600",
          borderColor: "border-red-300",
          badgeColor: "bg-red-100 text-red-800 border-red-300",
        };
      case "MEDIUM":
        return {
          icon: AlertCircle,
          bgColor: "bg-orange-500",
          hoverBgColor: "hover:bg-orange-600",
          textColor: "text-orange-600",
          borderColor: "border-orange-300",
          badgeColor: "bg-orange-100 text-orange-800 border-orange-300",
        };
      case "LOW":
        return {
          icon: CheckCircle,
          bgColor: "bg-green-500",
          hoverBgColor: "hover:bg-green-600",
          textColor: "text-green-600",
          borderColor: "border-green-300",
          badgeColor: "bg-green-100 text-green-800 border-green-300",
        };
      default:
        return {
          icon: Info,
          bgColor: "bg-blue-500",
          hoverBgColor: "hover:bg-blue-600",
          textColor: "text-blue-600",
          borderColor: "border-blue-300",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
        };
    }
  };

  const config = getSeverityConfig();
  const Icon = config.icon;

  return (
    <>
      {/* Indicator Button */}
      <button
        onClick={() => setShowModal(true)}
        className={`relative flex items-center gap-2 px-3 py-2 ${config.bgColor} ${config.hoverBgColor} text-white rounded-lg transition-all shadow-md hover:shadow-lg group`}
        title="Xem đánh giá AI"
      >
        <Sparkles className="w-5 h-5" />
        <span className="hidden md:inline text-sm font-medium">
          Đánh giá AI
        </span>
        {/* Pulse animation for attention */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping opacity-75"></div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"></div>
      </button>

      {/* Modal */}
      {showModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] px-4"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl relative z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className={`bg-gradient-to-r ${config.bgColor} ${config.hoverBgColor} p-6 border-b-2 ${config.borderColor}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Đánh giá AI
                      </h2>
                      <p className="text-white/90 text-sm mt-1">
                        Phân tích từ báo cáo và cảnh báo gần đây
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[65vh] space-y-6">
                {/* Severity Badge */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Mức độ nghiêm trọng</p>
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-semibold ${config.badgeColor}`}
                    >
                      <Icon className="w-5 h-5" />
                      {severity || "UNKNOWN"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      clearAnalysis();
                      setShowModal(false);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  >
                    Xóa đánh giá
                  </button>
                </div>

                {/* Cause */}
                {cause && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <AlertCircle className={`w-5 h-5 ${config.textColor}`} />
                      Nguyên nhân
                    </h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {cause}
                    </p>
                  </div>
                )}

                {/* Current Status */}
                {current_status && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Info className={`w-5 h-5 ${config.textColor}`} />
                      Tình trạng hiện tại
                    </h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {current_status}
                    </p>
                  </div>
                )}

                {/* Recommendation */}
                {recommendation && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Sparkles className={`w-5 h-5 ${config.textColor}`} />
                      Khuyến nghị
                    </h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {recommendation}
                    </p>
                  </div>
                )}

                {/* Timestamp */}
                {analysisResult.timestamp && (
                  <div className="text-xs text-gray-500 text-right pt-2 border-t border-gray-200">
                    Cập nhật: {new Date(analysisResult.timestamp).toLocaleString("vi-VN")}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

