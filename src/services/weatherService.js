// Weather Service - Google Maps Platform Weather API Integration
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const WEATHER_API_BASE = 'https://weather.googleapis.com/v1';

// Cache to avoid excessive API calls
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Weather type to icon mapping for Google Weather API
const WEATHER_ICON_MAP = {
  'CLEAR': '01',
  'CLOUDY': '03',
  'PARTLY_CLOUDY': '02',
  'MOSTLY_CLOUDY': '04',
  'RAIN': '10',
  'LIGHT_RAIN': '09',
  'HEAVY_RAIN': '10',
  'SNOW': '13',
  'LIGHT_SNOW': '13',
  'HEAVY_SNOW': '13',
  'THUNDERSTORM': '11',
  'FOG': '50',
  'HAZE': '50',
  'MIST': '50',
};

/**
 * Get weather data by coordinates
 * @param {Object} coordinates - { lat: number, lng: number }
 * @returns {Promise<Object>} Weather data
 */
export async function getWeatherByCoordinates(coordinates) {
  if (!coordinates || !coordinates.lat || !coordinates.lng) {
    throw new Error('Invalid coordinates');
  }

  const cacheKey = `${coordinates.lat.toFixed(2)},${coordinates.lng.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);

  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const url = `${WEATHER_API_BASE}/currentConditions:lookup?key=${WEATHER_API_KEY}&location.latitude=${coordinates.lat}&location.longitude=${coordinates.lng}&unitsSystem=METRIC`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('API key không hợp lệ hoặc Weather API chưa được enable');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Map Google weather type to icon code
    const weatherType = data.weatherCondition?.type || 'CLEAR';
    const iconCode = WEATHER_ICON_MAP[weatherType] || '01';
    const isDaytime = data.isDaytime !== false;
    const icon = `${iconCode}${isDaytime ? 'd' : 'n'}`;

    const weatherData = {
      temperature: Math.round(data.temperature?.degrees || 0),
      feelsLike: Math.round(data.feelsLikeTemperature?.degrees || 0),
      humidity: data.relativeHumidity || 0,
      windSpeed: Math.round(data.wind?.speed?.value || 0), // Already in km/h
      description: data.weatherCondition?.description?.text || 'Unknown',
      icon: icon,
      main: weatherType,
      pressure: Math.round(data.airPressure?.meanSeaLevelMillibars || 1013),
      visibility: Math.round(data.visibility?.distance || 10), // Already in km
      uvIndex: data.uvIndex || 0,
      cloudCover: data.cloudCover || 0,
      timestamp: Date.now(),
    };

    // Cache the result
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now(),
    });

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data from Google API:', error);

    // Return mock data for development/fallback
    return getMockWeatherData(coordinates);
  }
}

/**
 * Get weather icon URL (using OpenWeatherMap icons for consistency)
 * @param {string} iconCode - Icon code
 * @returns {string} Icon URL
 */
export function getWeatherIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

/**
 * Mock weather data for development/fallback
 */
function getMockWeatherData(coordinates) {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;

  return {
    temperature: Math.round(25 + Math.random() * 10),
    feelsLike: Math.round(26 + Math.random() * 10),
    humidity: Math.round(60 + Math.random() * 30),
    windSpeed: Math.round(10 + Math.random() * 15),
    description: isDay ? 'trời quang đãng' : 'trời quang, ít mây',
    icon: isDay ? '01d' : '01n',
    main: 'Clear',
    pressure: 1013,
    visibility: 10,
    timestamp: Date.now(),
    isMock: true,
  };
}

/**
 * Clear weather cache
 */
export function clearWeatherCache() {
  weatherCache.clear();
}
