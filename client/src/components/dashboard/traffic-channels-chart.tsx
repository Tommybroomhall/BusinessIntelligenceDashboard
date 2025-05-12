import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { 
  PieChart, 
  Pie, 
  ResponsiveContainer, 
  Cell, 
  Tooltip, 
  TooltipProps,
} from "recharts";

interface TrafficChannel {
  name: string;
  value: number;
  color: string;
}

interface TrafficChannelsChartProps {
  data: TrafficChannel[];
  total: number;
  title?: string;
}

export function TrafficChannelsChart({ 
  data, 
  total, 
  title = "Traffic Channels"
}: TrafficChannelsChartProps) {
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as TrafficChannel;
      return (
        <div className="bg-gray-900 text-white p-2 rounded text-xs">
          <p className="font-medium">{item.name}</p>
          <p>{item.value.toLocaleString()} visits</p>
          <p>{((item.value / total) * 100).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 text-gray-500">
          <Download className="mr-1 h-4 w-4" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Donut chart */}
          <div className="w-48 h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xs text-gray-500">TOTAL</p>
              <p className="text-lg font-bold text-gray-900">{total.toLocaleString()}</p>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-6 md:mt-0 space-y-3 flex-1 max-w-xs">
            {data.map((channel, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3" 
                  style={{ backgroundColor: channel.color }}
                ></div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{channel.name}</span>
                    <span className="text-sm text-gray-500">{channel.value.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full" 
                      style={{ 
                        width: `${(channel.value / total) * 100}%`,
                        backgroundColor: channel.color
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
