import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, UserPlus, Cog } from "lucide-react";

type ActivityType = "order" | "lead" | "system";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  details?: string;
  status?: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
  title?: string;
  onFilterChange?: (filter: string) => void;
}

export function ActivityFeed({ 
  activities, 
  title = "Activity Feed",
  onFilterChange
}: ActivityFeedProps) {
  
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "order":
        return (
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center ring-8 ring-white">
            <ShoppingCart className="h-5 w-5 text-purple-600" />
          </div>
        );
      case "lead":
        return (
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center ring-8 ring-white">
            <UserPlus className="h-5 w-5 text-green-600" />
          </div>
        );
      case "system":
        return (
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
            <Cog className="h-5 w-5 text-blue-600" />
          </div>
        );
    }
  };

  const getStatusBadge = (activity: Activity) => {
    if (!activity.status) return null;
    
    let bg = "bg-gray-100 text-gray-800";
    
    if (activity.status.toLowerCase() === "paid") {
      bg = "bg-green-100 text-green-800";
    } else if (activity.status.toLowerCase() === "new") {
      bg = "bg-yellow-100 text-yellow-800";
    } else if (activity.status.toLowerCase() === "system") {
      bg = "bg-blue-100 text-blue-800";
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg}`}>
        {activity.status}
      </span>
    );
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Select onValueChange={onFilterChange} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Activities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="order">Orders</SelectItem>
            <SelectItem value="lead">Leads</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, index) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {index < activities.length - 1 && (
                    <span
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    ></span>
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <a href="#" className="font-medium text-gray-900">
                            {activity.title}
                          </a>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {activity.description}
                        </p>
                      </div>
                      {activity.details && (
                        <div className="mt-2 text-sm text-gray-700">
                          <p dangerouslySetInnerHTML={{ __html: activity.details }} />
                        </div>
                      )}
                      <div className="mt-2 flex items-center space-x-2">
                        {getStatusBadge(activity)}
                        <span className="text-sm text-gray-500">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 text-center">
          <button className="text-sm font-medium text-primary hover:text-primary/80">
            Load More
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
