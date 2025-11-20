// Mock Weather Data
export const mockWeatherData = {
  temperature: 28,
  feelsLike: 30,
  humidity: 75,
  windSpeed: 15,
  description: 'Mưa rào nhẹ',
  icon: '10d',
  main: 'Rain',
  pressure: 1013,
  visibility: 8,
  uvIndex: 5,
  cloudCover: 60,
  timestamp: Date.now(),
};

export function getMockWeather(lat, lng) {
  // Simulate different weather based on location
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;
  const baseTemp = 25 + Math.sin((lat - 10) * 0.1) * 5;
  
  return {
    temperature: Math.round(baseTemp + Math.random() * 5),
    feelsLike: Math.round(baseTemp + Math.random() * 5 + 2),
    humidity: Math.round(60 + Math.random() * 30),
    windSpeed: Math.round(10 + Math.random() * 20),
    description: ['Mưa rào nhẹ', 'Trời quang đãng', 'Có mây', 'Mưa lớn'][Math.floor(Math.random() * 4)],
    icon: isDay ? '10d' : '10n',
    main: 'Rain',
    pressure: 1013,
    visibility: Math.round(5 + Math.random() * 10),
    uvIndex: Math.round(3 + Math.random() * 5),
    cloudCover: Math.round(40 + Math.random() * 40),
    timestamp: Date.now(),
  };
}

