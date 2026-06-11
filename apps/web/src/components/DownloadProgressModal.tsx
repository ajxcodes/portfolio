"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, Circle, AlertCircle, X, Download } from "lucide-react";

interface DownloadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl: string;
}

export const DownloadProgressModal = ({
  isOpen,
  onClose,
  apiBaseUrl,
}: DownloadProgressModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const steps = [
    "Analyzing profile data",
    "Generating ATS-friendly PDF layout",
    "Uploading to secure cloud storage",
    "Resume ready for download",
  ];

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentStep(0);
      setErrorMsg("");
      setDownloadUrl("");
      return;
    }

    let isMounted = true;

    // 1. Start progress animation simulation up to 85%
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        
        // Update steps based on progress thresholds
        const next = prev + Math.floor(Math.random() * 8) + 3;
        if (next >= 75) setCurrentStep(2);
        else if (next >= 40) setCurrentStep(1);
        
        return Math.min(next, 85);
      });
    }, 150);

    // 2. Perform real API request in the background
    const prepareResume = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/resume/active/download`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to prepare resume download. Please try again.");
        }

        const data = await response.json();
        
        if (!isMounted) return;

        // Fast-forward to completion
        clearInterval(progressInterval);
        setCurrentStep(3);
        setProgress(100);
        setDownloadUrl(data.downloadUrl);

      } catch (err: any) {
        if (!isMounted) return;
        clearInterval(progressInterval);
        setErrorMsg(err.message || "An unexpected error occurred.");
      }
    };

    prepareResume();

    return () => {
      isMounted = false;
      clearInterval(progressInterval);
    };
  }, [isOpen, apiBaseUrl]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center text-foreground font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={errorMsg ? onClose : undefined}
            className="fixed inset-0 bg-background/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="relative bg-card border border-primary/10 p-8 rounded-2xl max-w-sm w-full mx-4 shadow-2xl overflow-hidden z-10 flex flex-col items-center"
          >
            {/* Close Button if errored or complete */}
            {(errorMsg || progress === 100) && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Circular Progress Bar */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Circle */}
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-muted/20"
                  strokeWidth="6"
                  fill="transparent"
                />
                {/* Foreground Circle */}
                <motion.circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-primary"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={301.6}
                  initial={{ strokeDashoffset: 301.6 }}
                  animate={{
                    strokeDashoffset: 301.6 - (301.6 * progress) / 100,
                  }}
                  transition={{ ease: "easeInOut", duration: 0.3 }}
                />
              </svg>
              {/* Inner Text or Icon */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {errorMsg ? (
                  <AlertCircle className="w-8 h-8 text-destructive animate-pulse" />
                ) : progress === 100 ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
                ) : (
                  <span className="text-xl font-bold text-foreground">
                    {progress}%
                  </span>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-foreground mb-4">
              {errorMsg
                ? "Generation Failed"
                : progress === 100
                ? "Ready for Download!"
                : "Preparing ATS Resume"}
            </h3>

            {/* Error Message */}
            {errorMsg ? (
              <p className="text-xs text-destructive text-center mb-6 bg-destructive/5 p-3 rounded-lg border border-destructive/10">
                {errorMsg}
              </p>
            ) : (
              /* Steps Checklist */
              <div className="w-full space-y-3 mb-4 text-left">
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStep || progress === 100;
                  const isActive = idx === currentStep && progress < 100;

                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${
                        isCompleted
                          ? "text-emerald-500 font-medium"
                          : isActive
                          ? "text-primary font-semibold animate-pulse"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      ) : isActive ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="truncate">{step}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Actions */}
            {progress === 100 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 w-full"
              >
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="AlvinJorrelPascual-Resume.pdf"
                  className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Download File Directly
                </a>
              </motion.div>
            )}

            {errorMsg && (
              <button
                onClick={onClose}
                className="w-full py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-secondary/80 transition-all mt-4"
              >
                Close Dialog
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
