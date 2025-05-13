import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  PieChart, 
  Bell, 
  ShoppingCart, 
  Users, 
  Package, 
  LineChart, 
  User, 
  Settings, 
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/context/tenant-context";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: number;
}

const SidebarLink = ({ href, icon, children, badge }: SidebarLinkProps) => {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <li>
      <Link href={href}>
        <div className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
          isActive 
            ? "bg-primary-50 text-primary" 
            : "text-sidebar-foreground hover:bg-gray-100"
        )}>
          <span className="mr-2 w-5 h-5">{icon}</span>
          {children}
          {badge && (
            <span className="ml-auto bg-primary-100 text-primary py-0.5 px-2 rounded-full text-xs">
              {badge}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
};

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const { tenant } = useTenant();
  
  return (
    <aside className={cn("sidebar bg-sidebar w-64", isMobileOpen && "open")}>
      {/* Logo Area */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-white font-semibold">
            {tenant?.name?.charAt(0) || "B"}
          </div>
          <span className="ml-3 text-lg font-semibold text-sidebar-foreground">
            {tenant?.name || "BusinessDash"}
          </span>
        </div>
      </div>
      
      {/* Account section */}
      <div className="p-4 border-b border-sidebar-border">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          ACCOUNT
        </h3>
        <ul className="mt-3 space-y-1">
          <SidebarLink href="/" icon={<PieChart size={18} />}>
            Overview
          </SidebarLink>
          <SidebarLink href="/updates" icon={<Bell size={18} />} badge={3}>
            Updates
          </SidebarLink>
        </ul>
      </div>
      
      {/* Dashboards section */}
      <div className="p-4 border-b border-sidebar-border">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          DASHBOARDS
        </h3>
        <ul className="mt-3 space-y-1">
          <SidebarLink href="/sales" icon={<ShoppingCart size={18} />}>
            Sales
          </SidebarLink>
          <SidebarLink href="/customers" icon={<Users size={18} />}>
            Customers
          </SidebarLink>
          <SidebarLink href="/products" icon={<Package size={18} />}>
            Products
          </SidebarLink>
          <SidebarLink href="/traffic" icon={<LineChart size={18} />}>
            Traffic
          </SidebarLink>
        </ul>
      </div>
      
      {/* Pages section */}
      <div className="p-4 border-b border-sidebar-border">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          PAGES
        </h3>
        <ul className="mt-3 space-y-1">
          <SidebarLink href="/profile" icon={<User size={18} />}>
            Profile
          </SidebarLink>
          <SidebarLink href="/settings" icon={<Settings size={18} />}>
            Settings
          </SidebarLink>
        </ul>
      </div>
      
      {/* Spacer */}
      <div className="flex-grow"></div>
      
      {/* Logout */}
      <div className="p-4">
        <Button 
          variant="ghost" 
          className="flex w-full items-center justify-start px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground hover:bg-gray-100"
        >
          <LogOut size={18} className="mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
