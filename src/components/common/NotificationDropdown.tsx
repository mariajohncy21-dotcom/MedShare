import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, AlertTriangle, CheckCircle2, Clock, Truck, Info, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'EMERGENCY':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'SHORTAGE':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'RESERVATION':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'EXPIRY':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'TRANSFER':
        return <Truck className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          height: 36,
          width: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          color: '#475569',
          cursor: 'pointer',
          transition: 'all 0.12s ease',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = '#eff6ff';
          (e.currentTarget as HTMLElement).style.color = '#1d4ed8';
          (e.currentTarget as HTMLElement).style.borderColor = '#bfdbfe';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = '#f8fafc';
          (e.currentTarget as HTMLElement).style.color = '#475569';
          (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
        }}
        aria-label="Notifications"
      >
        <Bell style={{ width: 17, height: 17 }} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -3,
              right: -3,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 99,
              background: '#dc2626',
              color: '#fff',
              fontSize: 10,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #fff',
              boxShadow: '0 1px 3px rgba(220,38,38,0.4)',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 z-50 overflow-hidden border border-slate-100">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-sm">Emergency Dispatch Feed</h3>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-blue-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                No active notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 transition-colors hover:bg-slate-50 flex items-start gap-3 ${
                    !notif.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="mt-0.5 p-1.5 bg-white rounded-lg shadow-sm border border-slate-100 flex-shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    {notif.link && (
                      <Link
                        to={notif.link}
                        onClick={() => {
                          markNotificationRead(notif.id);
                          setIsOpen(false);
                        }}
                        className="inline-block mt-1.5 text-[11px] font-medium text-blue-600 hover:underline"
                      >
                        View Details &rarr;
                      </Link>
                    )}
                  </div>
                  {!notif.read && (
                    <button
                      onClick={() => markNotificationRead(notif.id)}
                      title="Mark as read"
                      className="text-slate-400 hover:text-blue-600 p-1 cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-600 block"></span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-500 font-medium">
              Real-time synchronization across healthcare nodes
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
