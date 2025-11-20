/**
 * Calculate risk score based on reports
 * @param {Array} reports - Array of report objects
 * @returns {number} Risk score from 0 to 10
 */
export function calculateRiskScore(reports) {
  if (!reports || reports.length === 0) return 0;

  const severityWeights = {
    high: 3,
    medium: 2,
    low: 1,
  };

  const totalWeight = reports.reduce((sum, report) => {
    return sum + (severityWeights[report.severity] || 0);
  }, 0);

  const avgWeight = totalWeight / reports.length;
  const score = Math.min(10, Math.round(avgWeight * 2.5));

  return score;
}

/**
 * Determine risk level based on score
 * @param {number} score - Risk score from 0 to 10
 * @returns {string} Risk level: 'low', 'medium', or 'high'
 */
export function getRiskLevel(score) {
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

/**
 * Calculate risk level based on reports
 * @param {Array} reports - Array of report objects
 * @returns {string} Risk level: 'low', 'medium', or 'high'
 */
export function calculateRiskLevel(reports) {
  const score = calculateRiskScore(reports);
  return getRiskLevel(score);
}

/**
 * Calculate combined risk from multiple factors
 * @param {Object} factors - Object with risk factors
 * @param {Array} factors.reports - Array of reports
 * @param {Object} factors.weather - Weather data
 * @param {number} factors.dangerZoneScore - Danger zone score
 * @returns {Object} { score: number, level: string }
 */
export function calculateCombinedRisk(factors) {
  const { reports = [], weather = null, dangerZoneScore = 0 } = factors;

  let score = calculateRiskScore(reports);

  // Adjust based on weather
  if (weather) {
    if (weather.main === 'Rain' || weather.main === 'Thunderstorm') {
      score += 1;
    }
    if (weather.windSpeed > 30) {
      score += 1;
    }
  }

  // Adjust based on danger zone
  score = (score + dangerZoneScore) / 2;

  score = Math.min(10, Math.max(0, score));

  return {
    score: Math.round(score * 10) / 10,
    level: getRiskLevel(score),
  };
}

