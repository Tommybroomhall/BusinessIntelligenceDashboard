import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

type TrendDirection = "up" | "down" | "neutral";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trendValue?: number;
  trendDirection?: TrendDirection;
  iconBgClass?: string;
  iconColor?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  icon,
  trendValue,
  trendDirection = "neutral",
  iconBgClass = "bg-primary-100",
  iconColor = "text-primary",
  className,
}: KpiCardProps) {
  const getTrendColor = (): string => {
    if (trendDirection === "up") return "text-green-600";
    if (trendDirection === "down") return "text-red-600";
    return "text-gray-500";
  };

  const getTrendIcon = () => {
    if (trendDirection === "up") return <ArrowUp className="mr-0.5 flex-shrink-0 self-center h-4 w-4" />;
    if (trendDirection === "down") return <ArrowDown className="mr-0.5 flex-shrink-0 self-center h-4 w-4" />;
    return null;
  };

  return (
    <div className={cn("bg-white overflow-hidden shadow-sm rounded-lg", className)}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBgClass)}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {trendValue !== undefined && (
                  <div className={cn("ml-2 flex items-baseline text-sm font-semibold", getTrendColor())}>
                    {getTrendIcon()}
                    <span>{trendValue}%</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
