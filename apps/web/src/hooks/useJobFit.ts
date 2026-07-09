import { useState } from 'react';

export interface JobFitAnalysis {
  matchScore: number;
  company: string;
  role: string;
  growthOpportunities: string[];
  actionChips: string[];
}

export function useJobFit() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<JobFitAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeJobFit = async (data: { rawText?: string; url?: string; file?: File }) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      if (data.rawText) formData.append('RawText', data.rawText);
      if (data.url) formData.append('Url', data.url);
      if (data.file) formData.append('File', data.file);
      
      const visitorSessionId = sessionStorage.getItem('visitor_session_id');
      if (visitorSessionId) formData.append('VisitorSessionId', visitorSessionId);

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/ai/job-fit/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to analyze job fit.');
      }

      const result = await response.json();
      const parsedResult = {
        matchScore: result.matchScore,
        company: result.company || "Unknown Company",
        role: result.role || "Unknown Role",
        growthOpportunities: result.growthOpportunities || [],
        actionChips: result.actionChips || [],
      };
      setAnalysisResult(parsedResult);
      return parsedResult;
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
  };

  return {
    isAnalyzing,
    analysisResult,
    error,
    analyzeJobFit,
    clearAnalysis,
  };
}
