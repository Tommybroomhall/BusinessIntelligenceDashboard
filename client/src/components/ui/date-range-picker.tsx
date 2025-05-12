import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Predefined date ranges
  const setLastWeek = () => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 7);
    onDateRangeChange({ from, to: today });
    setIsOpen(false);
  };

  const setLastMonth = () => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 30);
    onDateRangeChange({ from, to: today });
    setIsOpen(false);
  };

  const setThisMonth = () => {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    onDateRangeChange({ from, to: today });
    setIsOpen(false);
  };

  const setPreviousMonth = () => {
    const today = new Date();
    const lastMonth = today.getMonth() - 1;
    const year = lastMonth < 0 ? today.getFullYear() - 1 : today.getFullYear();
    const month = lastMonth < 0 ? 11 : lastMonth;
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0);
    onDateRangeChange({ from, to });
    setIsOpen(false);
  };

  return (
    <div className={cn("date-range-container relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center justify-between w-full"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL d, yyyy")} -{" "}
                    {format(dateRange.to, "LLL d, yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "LLL d, yyyy")
                )
              ) : (
                "Select date range"
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                variant="outline"
                className="text-sm"
                onClick={setLastWeek}
              >
                Last 7 days
              </Button>
              <Button
                variant="outline"
                className="text-sm"
                onClick={setLastMonth}
              >
                Last 30 days
              </Button>
              <Button
                variant="outline"
                className="text-sm"
                onClick={setThisMonth}
              >
                This month
              </Button>
              <Button
                variant="outline"
                className="text-sm"
                onClick={setPreviousMonth}
              >
                Last month
              </Button>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Custom Range</p>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange as any}
                numberOfMonths={2}
              />
              <Button 
                className="w-full" 
                onClick={() => setIsOpen(false)}
              >
                Apply Range
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
