import { useEffect, useRef, useCallback } from 'react';
import { analyzeWithAI } from '../services/api';
import { useAnalysis } from '../contexts/AnalysisContext';

/**
 * Custom hook to automatically analyze reports and alerts with AI
 * @param {Array} reports - Array of report objects
 * @param {Array} alerts - Array of alert/SOS objects
 * @param {Object} options - { debounceMs: 2000, enabled: true }
 */
export function useAIAnalysis(reports = [], alerts = [], options = {}) {
  const { updateAnalysis, setIsAnalyzing } = useAnalysis();
  const { debounceMs = 2000, enabled = true } = options;
  
  const lastAnalysisRef = useRef({
    reportsHash: null,
    alertsHash: null,
    timestamp: null,
  });
  
  const timeoutRef = useRef(null);

  // Create hash from reports/alerts to detect changes
  const createHash = useCallback((items) => {
    if (!items || items.length === 0) return null;
    // Create a simple hash from IDs and timestamps
    const ids = items
      .map(item => item.id || item.alertId || item._id || '')
      .filter(Boolean)
      .sort()
      .join(',');
    const timestamps = items
      .map(item => item.timestamp || item.UpdatedAt || item.createdAt || '')
      .filter(Boolean)
      .sort()
      .join(',');
    return `${ids}|${timestamps}`;
  }, []);

  // Transform report to API format
  const transformReport = useCallback((report) => {
    return {
      id: report.id || report._id || `report_${Date.now()}`,
      user_id: report.userId || report.user_id || report.UserID || '',
      type: report.type || report.category || 'OTHER',
      detail: report.detail || report.subCategory || '',
      description: report.description || report.body || '',
      image: report.image || (report.images && report.images[0]) || '',
      location: report.location || {
        type: 'Point',
        coordinates: [
          report.location?.lng || report.lng || 0,
          report.location?.lat || report.lat || 0,
        ],
      },
      timestamp: report.timestamp 
        ? (typeof report.timestamp === 'number' ? report.timestamp : new Date(report.timestamp).getTime())
        : Date.now(),
      status: report.status || '',
      phone_number: report.phone_number || report.phoneNumber || report.PhoneNumber || '',
      user_name: report.user_name || report.userName || report.UserName || '',
      enrichment: report.enrichment || {},
    };
  }, []);

  // Transform alert to API format
  const transformAlert = useCallback((alert) => {
    const userId = localStorage.getItem('userId') || '';
    
    return {
      alertId: alert.alertId || alert.id || alert._id || `alert_${Date.now()}`,
      UserID: alert.UserID || alert.userID || alert.user_id || alert.userId || userId,
      location: alert.location || {
        type: 'Point',
        coordinates: [
          alert.location?.lng || alert.lng || 0,
          alert.location?.lat || alert.lat || 0,
        ],
      },
      Body: alert.Body || alert.body || alert.message || '',
      RadiusM: alert.RadiusM || alert.radius_m || alert.radiusM || 10000,
      TTLMin: alert.TTLMin || alert.ttl_min || alert.ttlMin || 5,
      ExpiresAt: alert.ExpiresAt || alert.expires_at || alert.expiresAt,
      Visibility: alert.Visibility || alert.visibility || 'PUBLIC',
      Status: alert.Status || alert.status || 'RAISED',
      UserName: alert.UserName || alert.user_name || alert.userName || '',
      PhoneNumber: alert.PhoneNumber || alert.phone_number || alert.phoneNumber || '',
    };
  }, []);

  // Analyze with AI
  const performAnalysis = useCallback(async (reportsToAnalyze, alertsToAnalyze) => {
    if (!enabled) {
      console.log('🤖 [useAIAnalysis] Analysis disabled, skipping...');
      return;
    }

    // Only analyze if we have at least one report or alert
    if ((!reportsToAnalyze || reportsToAnalyze.length === 0) && 
        (!alertsToAnalyze || alertsToAnalyze.length === 0)) {
      console.log('🤖 [useAIAnalysis] No reports or alerts to analyze');
      return;
    }

    try {
      setIsAnalyzing(true);
      console.log('🤖 [useAIAnalysis] ========================================');
      console.log('🤖 [useAIAnalysis] Starting AI analysis');
      console.log('🤖 [useAIAnalysis] Reports:', reportsToAnalyze.length);
      console.log('🤖 [useAIAnalysis] Alerts:', alertsToAnalyze.length);

      // Prepare data for API
      const apiData = {};
      
      if (alertsToAnalyze && alertsToAnalyze.length > 0) {
        apiData.alerts = alertsToAnalyze.map(transformAlert);
        console.log('🤖 [useAIAnalysis] Transformed alerts:', apiData.alerts);
      }
      
      if (reportsToAnalyze && reportsToAnalyze.length > 0) {
        apiData.reports = reportsToAnalyze.map(transformReport);
        console.log('🤖 [useAIAnalysis] Transformed reports:', apiData.reports);
      }

      // Call AI analyze API
      const analysisResult = await analyzeWithAI(apiData);
      
      if (analysisResult) {
        const resultWithMetadata = {
          ...analysisResult,
          timestamp: new Date().toISOString(),
          source: alertsToAnalyze.length > 0 ? 'alert' : 'report',
          sourceCount: {
            reports: reportsToAnalyze.length,
            alerts: alertsToAnalyze.length,
          },
        };
        
        updateAnalysis(resultWithMetadata);
        console.log('✅ [useAIAnalysis] Analysis completed and stored');
        console.log('✅ [useAIAnalysis] Result:', resultWithMetadata);
      }
    } catch (error) {
      console.error('❌ [useAIAnalysis] Error analyzing:', error);
      // Don't update analysis on error, keep previous result
    } finally {
      setIsAnalyzing(false);
      console.log('🤖 [useAIAnalysis] ========================================');
    }
  }, [enabled, setIsAnalyzing, updateAnalysis, transformReport, transformAlert]);

  // Monitor reports and alerts for changes
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Create hashes
    const reportsHash = createHash(reports);
    const alertsHash = createHash(alerts);

    // Check if data has changed
    const hasChanged = 
      reportsHash !== lastAnalysisRef.current.reportsHash ||
      alertsHash !== lastAnalysisRef.current.alertsHash;

    if (!hasChanged) {
      console.log('🤖 [useAIAnalysis] No changes detected, skipping analysis');
      return;
    }

    // Debounce the analysis call
    console.log('🤖 [useAIAnalysis] Data changed, scheduling analysis in', debounceMs, 'ms');
    
    timeoutRef.current = setTimeout(() => {
      // Update ref before analysis
      lastAnalysisRef.current = {
        reportsHash,
        alertsHash,
        timestamp: Date.now(),
      };

      // Perform analysis
      performAnalysis(reports, alerts);
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [reports, alerts, enabled, debounceMs, createHash, performAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}

