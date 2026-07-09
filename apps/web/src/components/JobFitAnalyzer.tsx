'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJobFit } from '@/hooks/useJobFit';
import { BotIcon } from './icons';
import { type ProfileLink } from '@/lib/data';

interface JobFitAnalyzerProps {
  links?: ProfileLink[];
  onCancel: () => void;
  onAnalysisComplete?: (result: any) => void;
}

export function JobFitAnalyzer({ links, onCancel, onAnalysisComplete }: JobFitAnalyzerProps) {
  const { isAnalyzing, error, analyzeJobFit } = useJobFit();
  const [inputType, setInputType] = useState<'text' | 'url'>('text');
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    let result;
    if (inputType === 'text') {
      result = await analyzeJobFit({ rawText: inputValue });
    } else {
      result = await analyzeJobFit({ url: inputValue });
    }

    if (result && onAnalysisComplete) {
      onAnalysisComplete(result);
    }
  };

  return (
    <div className="flex flex-col bg-card border border-primary/20 rounded-xl p-4 m-4 shadow-lg text-sm">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <BotIcon className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-primary">Analyze Job Fit</h4>
        </div>
        <button onClick={onCancel} className="text-foreground/50 hover:text-foreground transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-4 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex bg-primary/5 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setInputType('text')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${inputType === 'text' ? 'bg-background shadow-sm text-primary' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Paste Description
          </button>
          <button
            type="button"
            onClick={() => setInputType('url')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${inputType === 'url' ? 'bg-background shadow-sm text-primary' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Paste URL
          </button>
        </div>

        {inputType === 'text' ? (
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Paste the job description here..."
            className="w-full h-32 bg-primary/5 border border-primary/20 rounded-xl p-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary text-sm"
          />
        ) : (
          <input
            type="url"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="https://example.com/job"
            className="w-full bg-primary/5 border border-primary/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
          />
        )}

        <button
          type="submit"
          disabled={!inputValue.trim() || isAnalyzing}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Fit...
            </>
          ) : (
            'Analyze'
          )}
        </button>
      </form>
    </div>
  );
}
