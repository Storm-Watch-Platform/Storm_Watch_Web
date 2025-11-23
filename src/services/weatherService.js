// Weather Service - OpenWeatherMap API Integration
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const WEATHER_API_BASE = "https://api.openweathermap.org/data/2.5";

// Cache to avoid excessive API calls
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Get weather data by coordinates
 * @param {Object} coordinates - { lat: number, lng: number }
 * @returns {Promise<Object>} Weather data
 */
export async function getWeatherByCoordinates(coordinates) {
  if (!coordinates || !coordinates.lat || !coordinates.lng) {
    throw new Error("Invalid coordinates");
  }

  const cacheKey = `${coordinates.lat.toFixed(2)},${coordinates.lng.toFixed(
    2
  )}`;
  const cached = weatherCache.get(cacheKey);

  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Check if API key is configured
  if (!WEATHER_API_KEY) {
    console.warn("VITE_WEATHER_API_KEY is not configured.");
    console.warn(
      "💡 Để lấy dữ liệu thời tiết thật, thêm VITE_WEATHER_API_KEY vào file .env"
    );
    // Don't return mock data - throw error instead
    throw new Error("VITE_WEATHER_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env hoặc Vercel Environment Variables.");
  }

  console.log(
    "✅ Weather API Key found:",
    WEATHER_API_KEY.substring(0, 10) + "..."
  );

  try {
    // OpenWeatherMap API endpoint
    const url = `${WEATHER_API_BASE}/weather?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${WEATHER_API_KEY}&units=metric&lang=vi`;

    console.log("🌤️ Fetching weather data for:", {
      lat: coordinates.lat,
      lng: coordinates.lng,
    });

    // OpenWeatherMap API supports CORS, no need for custom headers
    // Removing Content-Type header to avoid unnecessary preflight request
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;

      if (response.status === 401) {
        errorMessage =
          "API key không hợp lệ. Vui lòng kiểm tra lại VITE_WEATHER_API_KEY trong file .env";
      } else if (response.status === 429) {
        errorMessage = "Đã vượt quá giới hạn API calls. Vui lòng thử lại sau.";
      } else if (response.status === 404) {
        errorMessage = "Không tìm thấy dữ liệu thời tiết cho vị trí này.";
      }

      console.error("Weather API Error:", {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        url: url.replace(WEATHER_API_KEY, "***"),
      });

      throw new Error(errorMessage);
    }

    const data = await response.json();

    console.log("✅ Weather API response:", data);

    // Map OpenWeatherMap data to our format
    const weatherData = {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // Convert m/s to km/h
      description: data.weather[0]?.description || "Unknown",
      icon: data.weather[0]?.icon || "01d",
      main: data.weather[0]?.main || "Clear",
      pressure: Math.round(data.main.pressure),
      visibility: Math.round((data.visibility || 10000) / 1000), // Convert m to km
      uvIndex: 0, // OpenWeatherMap free tier doesn't include UV index
      cloudCover: data.clouds?.all || 0,
      timestamp: Date.now(),
      isMock: false, // Mark as real data
    };

    console.log("✅ Processed weather data:", weatherData);

    // Cache the result
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now(),
    });

    return weatherData;
  } catch (error) {
    console.error(
      "❌ Error fetching weather data from OpenWeatherMap API:",
      error
    );
    console.error("Error details:", {
      message: error.message,
      coordinates: { lat: coordinates.lat, lng: coordinates.lng },
      apiKey: WEATHER_API_KEY
        ? WEATHER_API_KEY.substring(0, 10) + "..."
        : "NOT SET",
    });

    // Always throw error to show in UI - don't silently fallback to mock
    // User should know if API is not working
    throw error;
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
 * @param {Object} coordinates - { lat: number, lng: number } (unused but kept for consistency)
 */
// eslint-disable-next-line no-unused-vars
function getMockWeatherData(coordinates) {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;

  return {
    temperature: Math.round(25 + Math.random() * 10),
    feelsLike: Math.round(26 + Math.random() * 10),
    humidity: Math.round(60 + Math.random() * 30),
    windSpeed: Math.round(10 + Math.random() * 15),
    description: isDay ? "trời quang đãng" : "trời quang, ít mây",
    icon: isDay ? "01d" : "01n",
    main: "Clear",
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
