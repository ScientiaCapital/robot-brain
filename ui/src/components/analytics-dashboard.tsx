"use client"

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AnalyticsData {
  summary: {
    totalConversations: number;
    avgResponseTimeMs: number;
    period: string;
  };
  eventCounts: Record<string, number>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
}

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics?days=${days}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchAnalytics} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Analytics Dashboard</h2>
        <div className="flex gap-2">
          {[1, 7, 30].map(d => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Conversations</p>
          <p className="text-2xl font-bold">{data?.summary.totalConversations || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Avg Response Time</p>
          <p className="text-2xl font-bold">{data?.summary.avgResponseTimeMs || 0}ms</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Period</p>
          <p className="text-2xl font-bold">{data?.summary.period || 'N/A'}</p>
        </Card>
      </div>

      {/* Event Counts */}
      {data?.eventCounts && Object.keys(data.eventCounts).length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Event Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(data.eventCounts).map(([type, count]) => (
              <div key={type} className="flex justify-between">
                <span className="text-sm text-gray-600">{type}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Hourly Distribution */}
      {data?.hourlyDistribution && data.hourlyDistribution.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Hourly Activity</h3>
          <div className="flex items-end gap-1 h-32">
            {data.hourlyDistribution.map(({ hour, count }) => {
              const maxCount = Math.max(...data.hourlyDistribution.map(d => d.count));
              const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div
                  key={hour}
                  className="flex-1 bg-blue-500 rounded-t"
                  style={{ height: `${height}%` }}
                  title={`${hour}:00 - ${count} conversations`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0:00</span>
            <span>12:00</span>
            <span>23:00</span>
          </div>
        </Card>
      )}
    </div>
  );
}
