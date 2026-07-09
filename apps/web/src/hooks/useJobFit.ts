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
      if (data.url) {
        const urlLower = data.url.toLowerCase();
        if (!urlLower.startsWith('http://') && !urlLower.startsWith('https://')) {
          throw new Error("URL must start with http:// or https://");
        }
        formData.append('Url', data.url);
      }
      if (data.file) {
        const allowedExtensions = ['.txt', '.pdf', '.docx'];
        const fileName = data.file.name.toLowerCase();
        if (!allowedExtensions.some(ext => fileName.endsWith(ext))) {
          throw new Error("Invalid file type. Only .txt, .pdf, and .docx are supported.");
        }
        formData.append('File', data.file);
      }
      
      const visitorSessionId = sessionStorage.getItem('visitor_session_id');
      if (visitorSessionId) formData.append('VisitorSessionId', visitorSessionId);

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      if (!apiBaseUrl) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL environment variable is not defined. Job Fit analysis cannot proceed.");
      }
      
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
