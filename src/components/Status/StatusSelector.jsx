import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Shield, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

const STATUS_OPTIONS = [
  {
    id: "SAFE",
    label: "An toàn",
    icon: CheckCircle,
    color: "green",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    textColor: "text-green-700",
    iconColor: "text-green-500",
    selectedBg: "bg-green-100",
    selectedBorder: "border-green-500",
  },
  {
    id: "CAUTION",
    label: "Cảnh báo",
    icon: AlertTriangle,
    color: "yellow",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-300",
    textColor: "text-yellow-700",
    iconColor: "text-yellow-500",
    selectedBg: "bg-yellow-100",
    selectedBorder: "border-yellow-500",
  },
  {
    id: "DANGER",
    label: "Nguy hiểm",
    icon: AlertCircle,
    color: "red",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    textColor: "text-red-700",
    iconColor: "text-red-500",
    selectedBg: "bg-red-100",
    selectedBorder: "border-red-500",
  },
];

const STATUS_STORAGE_KEY = "user_status";

export default function StatusSelector({ onStatusChange }) {
  const [status, setStatus] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem(STATUS_STORAGE_KEY);
    return saved || "UNKNOWN";
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Save to localStorage when status changes
    if (status !== "UNKNOWN") {
      localStorage.setItem(STATUS_STORAGE_KEY, status);
    }

    // Notify parent component
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);

  // Calculate dropdown position when expanded
  useEffect(() => {
    if (isExpanded && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, [isExpanded]);

  const currentStatus = STATUS_OPTIONS.find((s) => s.id === status) || {
    id: "UNKNOWN",
    label: "Chưa xác định",
    icon: Shield,
    color: "gray",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-300",
    textColor: "text-gray-700",
    iconColor: "text-gray-500",
  };

  const IconComponent = currentStatus.icon;

  return (
    <>
      <div className="relative">
        {/* Compact Button - Always Visible */}
        <button
          ref={buttonRef}
          onClick={() => setIsExpanded(!isExpanded)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all
            shadow-md hover:shadow-lg
            ${currentStatus.bgColor}
            ${currentStatus.borderColor}
            ${currentStatus.textColor}
            hover:scale-[1.02] active:scale-[0.98]
          `}
        >
          <IconComponent
            className={`w-5 h-5 ${currentStatus.iconColor} flex-shrink-0`}
          />
          <span className="font-semibold text-sm whitespace-nowrap">
            {currentStatus.label}
          </span>
          <div
            className={`w-2 h-2 rounded-full ${currentStatus.iconColor.replace(
              "text-",
              "bg-"
            )} ${status === "UNKNOWN" ? "opacity-50" : "animate-pulse"}`}
          ></div>
        </button>

        {/* Tooltip - Beautiful white tooltip */}
        {showTooltip && !isExpanded && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-[10000] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="bg-white rounded-lg shadow-2xl border-2 border-blue-200 p-3 max-w-[280px]">
              {/* Tooltip Arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="w-3 h-3 bg-white border-r-2 border-b-2 border-blue-200 transform rotate-45"></div>
              </div>

              {/* Tooltip Content - Compact */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <h4 className="font-bold text-gray-800 text-sm">
                    Trạng thái của bạn
                  </h4>
                </div>
                <p className="text-xs text-gray-600 mb-2.5 leading-relaxed">
                  Chọn trạng thái để gia đình theo dõi:
                </p>
                <div className="space-y-1.5 mb-2.5">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">
                      <span className="font-semibold text-green-600">
                        An toàn
                      </span>{" "}
                      - Ở nơi an toàn
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                    <span className="text-gray-700">
                      <span className="font-semibold text-yellow-600">
                        Cảnh báo
                      </span>{" "}
                      - Có rủi ro
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="text-gray-700">
                      <span className="font-semibold text-red-600">
                        Nguy hiểm
                      </span>{" "}
                      - Cần hỗ trợ
                    </span>
                  </div>
                </div>
                {/* <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-blue-600 font-medium text-center">
                    💡 Gửi cùng vị trí
                  </p>
                </div> */}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Options - Dropdown using Portal to render outside DOM hierarchy */}
      {isExpanded &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Backdrop to close on click outside */}
            <div
              className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm"
              onClick={() => setIsExpanded(false)}
            />

            {/* Dropdown Menu - Fixed positioning relative to button */}
            <div
              className="fixed z-[9999] bg-white rounded-xl shadow-2xl border-2 border-blue-200 overflow-hidden min-w-[240px]"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                // Adjust to prevent overflow on right side
                transform: "translateX(0)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 border-b-2 border-blue-600">
                <h3 className="text-white font-bold text-sm uppercase tracking-wide">
                  Chọn trạng thái
                </h3>
              </div>

              <div className="p-3 space-y-2">
                {STATUS_OPTIONS.map((option) => {
                  const OptionIcon = option.icon;
                  const isSelected = status === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        setStatus(option.id);
                        setIsExpanded(false);
                      }}
                      className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all text-left
                      ${
                        isSelected
                          ? `${option.selectedBg} ${option.selectedBorder} border-2 shadow-lg scale-[1.02]`
                          : `${option.bgColor} ${option.borderColor} border hover:shadow-md hover:scale-[1.01]`
                      }
                    `}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected ? option.bgColor : "bg-white"
                        }`}
                      >
                        <OptionIcon
                          className={`w-5 h-5 ${option.iconColor} flex-shrink-0`}
                        />
                      </div>
                      <div className="flex-1">
                        <div
                          className={`font-bold text-base ${option.textColor}`}
                        >
                          {option.label}
                        </div>
                        {isSelected && (
                          <div className="text-xs text-gray-600 mt-0.5 font-medium">
                            ✓ Đang chọn
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle
                          className={`w-6 h-6 ${option.iconColor} flex-shrink-0`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-t-2 border-blue-200">
                <p className="text-xs text-blue-700 text-center font-medium">
                  💡 Trạng thái sẽ được gửi cùng vị trí
                </p>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}

// Export function to get current status
export function getCurrentStatus() {
  return localStorage.getItem(STATUS_STORAGE_KEY) || "UNKNOWN";
}
