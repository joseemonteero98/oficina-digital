'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { Bell, Check } from 'lucide-react';

export function NotificationCenter() {
  const { notifications, markAllNotificationsRead, switchRole, setActiveSection, currentRole } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.leida).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificaciones"
        className="relative w-10 h-10 rounded-[6px] flex items-center justify-center text-black hover:bg-[#F7F8FA] border border-transparent hover:border-[#E5E7EB]"
      >
        <Bell className="w-5 h-5" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#DC2626] text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-[#D1D5DB] rounded-[8px] z-50 overflow-hidden shadow-md">
          <div className="px-4 py-3 bg-[#F7F8FA] border-b border-[#E5E7EB] flex items-center justify-between">
            <span className="text-[14px] font-semibold text-black">Notificaciones</span>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="text-[12px] font-medium text-[#2563EB] hover:underline flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2} />
                Marcar leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#E5E7EB]">
            {notifications.length === 0 ? (
              <div className="p-5 text-center text-[13px] text-[#525252]">
                No tienes notificaciones pendientes.
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (n.targetRole && n.targetRole !== currentRole) {
                      switchRole(n.targetRole);
                    }
                    if (n.targetSection) {
                      setActiveSection(n.targetSection);
                    }
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-[#F7F8FA] transition-colors ${
                    !n.leida ? 'bg-[#EFF6FF]/40' : 'bg-white'
                  }`}
                >
                  <p className="text-[13px] font-semibold text-black">{n.titulo}</p>
                  <p className="text-[12px] text-[#525252] mt-0.5">{n.mensaje}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
