import React, { useEffect, useRef, useState } from "react";
import { Search, Loader2, Crosshair } from "lucide-react";

export default function SearchLocation({
  onLocationSelect,
  isDisabled,
  regions = [],
  mapsReady,
  onUseCurrentLocation,
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [manualAddress, setManualAddress] = useState("");
  const [initialised, setInitialised] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!mapsReady || initialised) return;
    if (!window.google || !window.google.maps || !window.google.maps.places)
      return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        fields: ["geometry", "formatted_address", "name"],
        componentRestrictions: { country: ["vn"] },
      }
    );

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry) return;

      const location = place.geometry.location;
      const selectedLocation = {
        lat: location.lat(),
        lng: location.lng(),
        address: place.formatted_address || place.name,
      };

      setManualAddress(selectedLocation.address || "");
      setError("");
      onLocationSelect(selectedLocation);
    });

    setInitialised(true);
  }, [mapsReady, initialised, onLocationSelect]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualAddress || isDisabled || isSearching) return;

    setIsSearching(true);
    setError("");

    // Use Google Maps Geocoding API if available
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode(
        {
          address: manualAddress,
          componentRestrictions: { country: "vn" }, // Restrict to Vietnam
          region: "vn",
        },
        (results, status) => {
          setIsSearching(false);

          if (status === "OK" && results && results.length > 0) {
            const result = results[0];
            const location = result.geometry.location;
            setError("");
            setManualAddress(result.formatted_address);
            onLocationSelect({
              lat: location.lat(),
              lng: location.lng(),
              address: result.formatted_address,
            });
          } else if (status === "ZERO_RESULTS") {
            setError(
              "Không tìm thấy địa điểm. Vui lòng thử nhập cụ thể hơn hoặc kiểm tra chính tả."
            );
          } else if (status === "OVER_QUERY_LIMIT") {
            setError("Đã vượt quá giới hạn tìm kiếm. Vui lòng thử lại sau.");
          } else if (status === "REQUEST_DENIED") {
            setError("Yêu cầu bị từ chối. Vui lòng kiểm tra cấu hình API key.");
          } else {
            setError("Không thể tìm kiếm địa điểm. Vui lòng thử lại.");
          }
        }
      );
      return;
    }

    // Fallback to OpenStreetMap Nominatim if Google Maps is not available
    try {
      const queryUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        manualAddress
      )}&format=json&limit=1&countrycodes=vn&accept-language=vi`;

      const response = await fetch(queryUrl, {
        headers: {
          "Accept-Language": "vi",
          "User-Agent": "StormWatch App",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIsSearching(false);

      if (data && data.length > 0) {
        const result = data[0];
        onLocationSelect({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name,
        });
        setManualAddress(result.display_name);
        setError("");
      } else {
        setError("Không tìm thấy địa điểm. Thử nhập cụ thể hơn.");
      }
    } catch (err) {
      setIsSearching(false);
      console.error("Fallback geocode error", err);
      setError(
        "Không thể tìm kiếm địa điểm. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau."
      );
    }
  };

  const handleRegionChange = (e) => {
    const regionId = e.target.value;
    setSelectedRegion(regionId);
    const region = regions.find((r) => r.id === regionId);
    if (region) {
      setManualAddress(region.address);
      setError("");
      onLocationSelect({
        lat: region.center.lat,
        lng: region.center.lng,
        address: region.address,
      });
    }
  };

  const handleUseCurrentLocation = async () => {
    setError("");
    setIsSearching(true);

    if (onUseCurrentLocation) {
      try {
        await onUseCurrentLocation();
        setIsSearching(false);
        setError("");
      } catch (err) {
        setIsSearching(false);
        setError(
          err?.message ||
            "Không thể lấy vị trí hiện tại. Hãy bật quyền truy cập vị trí cho trình duyệt."
        );
      }
      return;
    }

    if (!navigator.geolocation) {
      setIsSearching(false);
      setError("Trình duyệt không hỗ trợ xác định vị trí.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Use reverse geocoding to get address from coordinates
        if (
          window.google &&
          window.google.maps &&
          window.google.maps.Geocoder
        ) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              setIsSearching(false);
              if (status === "OK" && results && results.length > 0) {
                const address = results[0].formatted_address;
                setManualAddress(address);
                onLocationSelect({
                  lat: latitude,
                  lng: longitude,
                  address: address,
                });
              } else {
                // Fallback if reverse geocoding fails
                onLocationSelect({
                  lat: latitude,
                  lng: longitude,
                  address: "Vị trí hiện tại của bạn",
                });
              }
            }
          );
        } else {
          // Fallback without reverse geocoding
          setIsSearching(false);
          onLocationSelect({
            lat: latitude,
            lng: longitude,
            address: "Vị trí hiện tại của bạn",
          });
        }
      },
      (err) => {
        setIsSearching(false);
        let errorMsg = "Không thể lấy vị trí. ";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg +=
              "Quyền truy cập vị trí bị từ chối. Vui lòng cho phép trong cài đặt trình duyệt.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg +=
              "Không thể xác định vị trí. Vui lòng kiểm tra GPS/WiFi.";
            break;
          case err.TIMEOUT:
            errorMsg += "Hết thời gian chờ. Vui lòng thử lại.";
            break;
          default:
            errorMsg += "Hãy bật quyền truy cập vị trí cho trình duyệt.";
        }
        setError(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-4 shadow-lg space-y-4">
      <div className="flex flex-col gap-2">
        <label className="block text-sm font-semibold text-blue-700">
          Chọn nhanh vùng theo tỉnh/thành
        </label>
        <select
          className="bg-white border border-blue-200 rounded-xl px-4 py-2 text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          value={selectedRegion}
          onChange={handleRegionChange}
          disabled={isDisabled}
        >
          <option value="">-- Chọn vùng --</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleManualSubmit}>
        <label className="block text-sm font-semibold text-blue-700 mb-2">
          Tìm kiếm vị trí trên bản đồ
        </label>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="Nhập địa điểm (VD: Kim Long, Huế)..."
                className="w-full bg-white text-blue-800 placeholder:text-blue-400 border border-blue-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                disabled={isDisabled}
              />
            </div>
            <button
              type="submit"
              disabled={isDisabled || isSearching}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {isDisabled || isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>{isSearching ? "Đang tìm..." : "Tìm"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isDisabled || isSearching}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Crosshair className="w-4 h-4" />
            )}
            {isSearching ? "Đang lấy vị trí..." : "Dùng vị trí hiện tại"}
          </button>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          {mapsReady ? (
            <>
              Sử dụng Google Maps để tìm kiếm địa điểm chính xác. Có thể nhập
              địa chỉ, chọn tỉnh trong danh sách hoặc dùng vị trí hiện tại. Hệ
              thống sẽ hiển thị các báo cáo trong bán kính 5km gần nhất.
            </>
          ) : (
            <>
              Có thể nhập địa chỉ, chọn tỉnh trong danh sách hoặc dùng vị trí
              hiện tại. Hệ thống sẽ hiển thị các báo cáo trong bán kính 5km gần
              nhất.
            </>
          )}
        </p>
        {error && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
