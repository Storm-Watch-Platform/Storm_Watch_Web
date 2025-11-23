import React, { createContext, useContext, useState, useEffect } from 'react';

const AnalysisContext = createContext();

export function AnalysisProvider({ children }) {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Listen for analysis updates from localStorage (set by STOMP service)
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('ai_analysis_result');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAnalysisResult(parsed);
        } catch (error) {
          console.error('[AnalysisContext] Error parsing stored analysis:', error);
        }
      }
    };

    // Listen for AI analysis events
    const handleAnalysisStart = (event) => {
      console.log('[AnalysisContext] AI analysis started:', event.detail);
      setIsAnalyzing(true);
    };

    const handleAnalysisSuccess = (event) => {
      console.log('[AnalysisContext] AI analysis success:', event.detail);
      setIsAnalyzing(false);
      // Update result from localStorage (set by STOMP service)
      handleStorageChange();
    };

    const handleAnalysisError = (event) => {
      console.error('[AnalysisContext] AI analysis error:', event.detail);
      setIsAnalyzing(false);
    };

    // Check on mount
    handleStorageChange();

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom events (from same window)
    window.addEventListener('ai-analysis-updated', handleStorageChange);
    window.addEventListener('ai-analysis-start', handleAnalysisStart);
    window.addEventListener('ai-analysis-success', handleAnalysisSuccess);
    window.addEventListener('ai-analysis-error', handleAnalysisError);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ai-analysis-updated', handleStorageChange);
      window.removeEventListener('ai-analysis-start', handleAnalysisStart);
      window.removeEventListener('ai-analysis-success', handleAnalysisSuccess);
      window.removeEventListener('ai-analysis-error', handleAnalysisError);
    };
  }, []);

  const updateAnalysis = (result) => {
    setAnalysisResult(result);
    // Store in localStorage for persistence
    if (result) {
      localStorage.setItem('ai_analysis_result', JSON.stringify(result));
      // Dispatch custom event for same-window updates
      window.dispatchEvent(new Event('ai-analysis-updated'));
    } else {
      localStorage.removeItem('ai_analysis_result');
      window.dispatchEvent(new Event('ai-analysis-updated'));
    }
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
    localStorage.removeItem('ai_analysis_result');
    window.dispatchEvent(new Event('ai-analysis-updated'));
  };

  return (
    <AnalysisContext.Provider
      value={{
        analysisResult,
        isAnalyzing,
        setIsAnalyzing,
        updateAnalysis,
        clearAnalysis,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within AnalysisProvider');
  }
  return context;
}

