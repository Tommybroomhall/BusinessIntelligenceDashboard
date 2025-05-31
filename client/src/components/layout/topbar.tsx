import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useTenant } from "@/context/tenant-context";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface TopbarProps {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { tenant } = useTenant();
  
  // Format the page title based on the current route
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Overview";
      case "/sales":
        return "Sales";
      case "/traffic":
        return "Traffic";
      case "/settings":
        return "Settings";
      default:
        return "Dashboard";
    }
  };
  
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3 sm:px-6 md:flex items-center justify-between">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          onClick={onMenuToggle}
        >
          <span className="sr-only">Open menu</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
      </div>
      
      <div className="mt-4 md:mt-0 flex items-center space-x-4">
        {/* Notification Bell */}
        <NotificationBell
          tenantId={tenant?.id?.toString()}
          userId={user?.id?.toString()}
          className="mr-2"
        />

        {/* User Profile */}
        <div className="relative">
          <div className="flex items-center space-x-2">
            <Avatar className="h-9 w-9 bg-primary-100">
              <AvatarFallback className="text-primary-700">
                {user?.name ? user.name.charAt(0) + user.name.split(' ')[1]?.charAt(0) : 'JS'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-gray-700">
                {user?.name || 'Jane Smith'}
              </div>
              <div className="text-xs text-gray-500">
                {user?.role || 'Admin'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
