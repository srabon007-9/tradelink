/**
 * context/ToastContext.jsx — Top-Right Popup Notification System
 *
 * Provides application-wide top-right popup notifications for important
 * transactions, bookings, status changes, and system alerts.
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
    }, 4000);
  }, []);

  const removeToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Top-Right Popup Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-2">
        {toasts.map(toast => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl shadow-2xl border transition-all duration-300 transform animate-in slide-in-from-top-4 fade-in ${
                isSuccess
                  ? 'bg-slate-950/95 text-white border-emerald-500/50 shadow-emerald-950/20'
                  : isError
                  ? 'bg-slate-950/95 text-white border-red-500/50 shadow-red-950/20'
                  : isWarning
                  ? 'bg-slate-950/95 text-white border-amber-500/50 shadow-amber-950/20'
                  : 'bg-slate-950/95 text-white border-sky-500/50 shadow-sky-950/20'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-lg flex-shrink-0 mt-0.5">
                  {isSuccess ? '🎉' : isError ? '❌' : isWarning ? '🔔' : 'ℹ️'}
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase font-bold tracking-wider text-steel-400 mb-0.5">
                    {isSuccess ? 'Success' : isError ? 'Alert' : isWarning ? 'Notice' : 'Notification'}
                  </p>
                  <p className="text-sm font-medium leading-snug text-slate-100 break-words">{toast.message}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-steel-400 hover:text-white text-xs font-bold p-1 rounded transition-colors flex-shrink-0 ml-2"
                title="Dismiss"
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
