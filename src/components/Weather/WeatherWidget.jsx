import React from 'react';
import { Cloud, Droplets, Wind, Loader, AlertCircle, Thermometer } from 'lucide-react';
import { getWeatherIconUrl } from '../../services/weatherService';

/**
 * WeatherWidget Component
 * Displays current weather information based on coordinates
 */
function WeatherWidget({ weatherData, isLoading, error }) {
  if (error) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Thời tiết</p>
            <p className="text-sm">Không thể tải</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !weatherData) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Thời tiết</p>
        <div className="flex items-center gap-2 mt-2">
          <Loader className="w-5 h-5 text-blue-400 animate-spin" />
          <p className="text-sm text-slate-300">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
      {/* Animated background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-purple-500/10 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Thời tiết hiện tại</p>
          {weatherData.isMock && (
            <p className="text-xs text-amber-400/70 flex items-center gap-1">
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
                <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl" />
                <img
                  src={getWeatherIconUrl(weatherData.icon)}
                  alt={weatherData.description}
                  className="w-20 h-20 relative z-10 drop-shadow-lg"
                />
              </div>
            )}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white drop-shadow-lg">
                  {weatherData.temperature}
                </span>
                <span className="text-3xl text-slate-300">°C</span>
              </div>
              <p className="text-sm text-slate-300 capitalize mt-1 font-medium">
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
              <p className="text-xs text-slate-400 mb-1">Độ ẩm</p>
              <p className="text-lg font-bold text-white">{weatherData.humidity}%</p>
            </div>

            {/* Wind Speed */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-cyan-500/20 p-3 rounded-xl mb-2">
                <Wind className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-xs text-slate-400 mb-1">Gió</p>
              <p className="text-lg font-bold text-white">{weatherData.windSpeed}</p>
              <p className="text-xs text-slate-400">km/h</p>
            </div>

            {/* Feels Like */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-orange-500/20 p-3 rounded-xl mb-2">
                <Thermometer className="w-6 h-6 text-orange-400" />
              </div>
              <p className="text-xs text-slate-400 mb-1">Cảm giác</p>
              <p className="text-lg font-bold text-white">{weatherData.feelsLike}°C</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeatherWidget;
