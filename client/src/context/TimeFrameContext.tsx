/**
 * TimeFrameContext.tsx
 * 
 * Purpose: Shared context for time frame selection across dashboard components
 * Key Functions: Provides selectedTimeFrame state and setter for dashboard-wide time filtering
 * Dependencies: React context hooks
 */

import React, { createContext, useContext, useState, useMemo } from 'react';

type TimeFrame = "7d" | "30d";

interface TimeFrameContextType {
  selectedTimeFrame: TimeFrame;
  setSelectedTimeFrame: (timeFrame: TimeFrame) => void;
  currentRange: {
    from: string;
    to: string;
  };
  previousRange: {
    from: string;
    to: string;
  };
}

const TimeFrameContext = createContext<TimeFrameContextType | undefined>(undefined);

export function TimeFrameProvider({ children }: { children: React.ReactNode }) {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>("7d");

  // Calculate stable date ranges only when timeframe changes
  const { currentRange, previousRange } = useMemo(() => {
    // Get current date as YYYY-MM-DD string to ensure stability
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today in local time

    const days = selectedTimeFrame === "7d" ? 7 : 30;

    // Current period
    const currentStartDate = new Date(today);
    currentStartDate.setDate(today.getDate() - days + 1);

    const currentEndDate = new Date(today);
    currentEndDate.setHours(23, 59, 59, 999);

    // Previous period
    const previousEndDate = new Date(currentStartDate);
    previousEndDate.setDate(currentStartDate.getDate() - 1);
    previousEndDate.setHours(23, 59, 59, 999);

    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setDate(previousEndDate.getDate() - days + 1);
    previousStartDate.setHours(0, 0, 0, 0);

    return {
      currentRange: {
        from: currentStartDate.toISOString(),
        to: currentEndDate.toISOString(),
      },
      previousRange: {
        from: previousStartDate.toISOString(),
        to: previousEndDate.toISOString(),
      }
    };
  }, [selectedTimeFrame]);

  return (
    <TimeFrameContext.Provider value={{
      selectedTimeFrame,
      setSelectedTimeFrame,
      currentRange,
      previousRange
    }}>
      {children}
    </TimeFrameContext.Provider>
  );
}

export function useTimeFrame() {
  const context = useContext(TimeFrameContext);
  if (context === undefined) {
    throw new Error('useTimeFrame must be used within a TimeFrameProvider');
  }
  return context;
} 