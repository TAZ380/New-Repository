import React from 'react';
import { Menu, Stethoscope } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Menu Button */}
          <button
            onClick={onMenuClick}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Center: Logo */}
          <div className="flex items-center">
            <Stethoscope className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">NurseJobs</span>
          </div>

          {/* Right: Notifications */}
          <div className="flex items-center">
            <NotificationBell />
          </div>
        </div>
      </div>
    </nav>
  );
}