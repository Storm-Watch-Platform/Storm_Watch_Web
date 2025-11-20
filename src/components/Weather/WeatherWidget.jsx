import React from "react";
import {
  Cloud,
  Droplets,
  Wind,
  Loader,
  AlertCircle,
  Thermometer,
} from "lucide-react";
import { getWeatherIconUrl } from "../../services/weatherService";

/**
 * WeatherWidget Component
 * Displays current weather information based on coordinates
 */
function WeatherWidget({ weatherData, isLoading, error }) {
  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur-md border border-red-300 rounded-2xl p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-blue-600 uppercase tracking-wide mb-2 font-semibold">
              Thời tiết
            </p>
            <p className="text-sm text-red-600 font-medium mb-2">
              Không thể tải dữ liệu thời tiết
            </p>
            <details className="text-xs text-blue-700">
              <summary className="cursor-pointer text-red-500 hover:text-red-600 mb-1 font-medium">
                Chi tiết lỗi
              </summary>
              <pre className="mt-2 p-2 bg-red-50 rounded text-xs whitespace-pre-wrap break-words text-red-700">
                {error}
              </pre>
            </details>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !weatherData) {
    return (
      <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-2xl p-5 shadow-lg">
        <p className="text-xs text-blue-600 uppercase tracking-wide mb-2 font-semibold">
          Thời tiết
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Loader className="w-5 h-5 text-blue-500 animate-spin" />
          <p className="text-sm text-blue-700 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 backdrop-blur-md border border-blue-200 rounded-2xl p-6 relative overflow-hidden shadow-lg">
      {/* Animated background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-cyan-400/15 to-blue-500/20 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-400/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-400/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold">
            Thời tiết hiện tại
          </p>
            {weatherData.isMock && (
            <p className="text-xs text-amber-600/80 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Dữ liệu mô phỏng
            </p>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Main Temperature Display */}
          <div className="flex items-center gap-4">
            {weatherData.icon && (
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-xl" />
                <img
                  src={getWeatherIconUrl(weatherData.icon)}
                  alt={weatherData.description}
                  className="w-20 h-20 relative z-10 drop-shadow-md"
                />
              </div>
            )}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-blue-700 drop-shadow-sm">
                  {weatherData.temperature}
                </span>
                <span className="text-3xl text-blue-600">°C</span>
              </div>
              <p className="text-sm text-blue-700 capitalize mt-1 font-medium">
                {weatherData.description}
              </p>
            </div>
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-3 gap-6 md:gap-8">
            {/* Humidity */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-500/20 p-3 rounded-xl mb-2">
                <Droplets className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-xs text-blue-600 mb-1 font-medium">Độ ẩm</p>
              <p className="text-lg font-bold text-blue-700">
                {weatherData.humidity}%
              </p>
            </div>

            {/* Wind Speed */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-cyan-400/40 p-3 rounded-xl mb-2">
                <Wind className="w-6 h-6 text-cyan-600" />
              </div>
              <p className="text-xs text-blue-600 mb-1 font-medium">Gió</p>
              <p className="text-lg font-bold text-blue-700">
                {weatherData.windSpeed}
              </p>
              <p className="text-xs text-blue-500">km/h</p>
            </div>

            {/* Feels Like */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-orange-400/40 p-3 rounded-xl mb-2">
                <Thermometer className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-xs text-blue-600 mb-1 font-medium">Cảm giác</p>
              <p className="text-lg font-bold text-blue-700">
                {weatherData.feelsLike}°C
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherWidget;
