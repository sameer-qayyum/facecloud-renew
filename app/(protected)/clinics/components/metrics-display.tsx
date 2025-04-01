'use client';

import { Badge } from '@/components/ui/badge';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClinicStore } from '@/lib/stores/clinic-store';

interface MetricsDisplayProps {
  title: string;
  value: number;
  change: number;
  prefix?: string;
}

export function MetricsDisplay({ 
  title, 
  value, 
  change, 
  prefix = '' 
}: MetricsDisplayProps) {
  // Get timeframe from global store
  const { timeframe } = useClinicStore();
  
  // Format currency using Intl for locale awareness
  const formattedValue = value > 0 
    ? prefix + new Intl.NumberFormat('en-AU', {
        minimumFractionDigits: prefix ? 2 : 0,
        maximumFractionDigits: prefix ? 2 : 0
      }).format(value)
    : prefix + '0';
    
  const isPositive = change >= 0;
  const changeAbs = Math.abs(change).toFixed(1);
  
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{formattedValue}</p>
      <div className="flex items-center">
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs px-1.5 py-0.5 flex items-center",
            isPositive ? "bg-green-50 text-green-700 border-green-200" : 
                         "bg-red-50 text-red-700 border-red-200"
          )}
        >
          {isPositive ? (
            <ArrowUpIcon className="h-3 w-3 mr-1" />
          ) : (
            <ArrowDownIcon className="h-3 w-3 mr-1" />
          )}
          {changeAbs}%
        </Badge>
        <span className="text-xs text-muted-foreground ml-2">
          vs previous {timeframe}
        </span>
      </div>
    </div>
  );
}
