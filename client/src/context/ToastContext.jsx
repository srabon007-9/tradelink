/**
 * context/ToastContext.jsx — Floating Toast Notification System
 */

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2">
        {toasts.map(toast => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 animate-in slide-in-from-top-2 ${
                isSuccess
                  ? 'bg-emerald-900 text-white border-emerald-700'
                  : isError
                  ? 'bg-red-900 text-white border-red-700'
                  : isWarning
                  ? 'bg-amber-900 text-white border-amber-700'
                  : 'bg-navy-900 text-white border-navy-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">
                  {isSuccess ? '✅' : isError ? '⚠️' : isWarning ? '🔔' : 'ℹ️'}
                </span>
                <p className="text-sm font-medium leading-snug">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-white/70 hover:text-white text-xs font-bold p-1 rounded"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
