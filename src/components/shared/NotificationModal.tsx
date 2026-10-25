import React from 'react';
import { Bell, AlertTriangle, CheckCircle2, Info, ShieldAlert, X } from 'lucide-react';
import { AlertNotification } from '../../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AlertNotification[];
  onMarkAllRead: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg shadow-inner">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Notifications & Alerts</h3>
              <p className="text-[11px] text-blue-100">{notifications.length} recent messages</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No new notifications at this time.
            </div>
          ) : (
            notifications.map((n) => {
              const isDanger = n.type === 'danger';
              const isWarning = n.type === 'warning';
              const isSuccess = n.type === 'success';

              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                    isDanger
                      ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60'
                      : isWarning
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
                      : isSuccess
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDanger && <ShieldAlert className="w-4 h-4 text-rose-600" />}
                    {isWarning && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {!isDanger && !isWarning && !isSuccess && <Info className="w-4 h-4 text-blue-600" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong className={`font-bold ${
                        isDanger ? 'text-rose-900 dark:text-rose-200' :
                        isWarning ? 'text-amber-900 dark:text-amber-200' :
                        isSuccess ? 'text-emerald-900 dark:text-emerald-200' : 'text-blue-900 dark:text-blue-200'
                      }`}>
                        {n.title}
                      </strong>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                      {n.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <button
            onClick={onMarkAllRead}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
          >
            Mark all as read
          </button>
          <button
            onClick={onClose}
            className="py-1 px-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
