import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, XCircle, Ban, X } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorType: string;
  errorMessage: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, errorType, errorMessage }) => {
  // Determine icon and colors based on error type
  const isRateLimit = errorType === 'RATE_LIMIT_EXCEEDED';
  const isTokenLimit = errorType === 'TOKEN_LIMIT_EXCEEDED';
  
  let Icon = AlertCircle;
  let title = "An Error Occurred";
  let description = errorMessage;
  
  if (isRateLimit) {
    Icon = Ban;
    title = "Rate Limit Exceeded";
    description = "We're receiving too many requests right now. Please wait a moment and try again.";
  } else if (isTokenLimit) {
    Icon = XCircle;
    title = "Token Limit Exceeded";
    description = "The resume content is too large to process in a single request. Please try uploading a shorter version.";
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-md pointer-events-auto border border-red-100 relative"
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="p-6 pt-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <Icon className="text-red-500 w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {title}
                </h3>
                
                <p className="text-slate-600 mb-6">
                  {description}
                </p>
                
                <div className="w-full flex gap-3">
                  <button 
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
