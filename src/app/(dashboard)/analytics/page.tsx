"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatsCard } from "@/components/analytics/StatsCard";
import { PageLoader } from "@/components/ui/Spinner";
import { useDashboard, useProperties } from "@/hooks/useChannels";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, DollarSign, Users, BarChart2 } from "lucide-react";

const CHANNEL_COLORS = ["#3b82f6", "#f43f5e", "#f97316", "#a855f7", "#22c55e", "#eab308", "#64748b"];

export default function AnalyticsPage() {
  const { data: properties } = useProperties();
  const [propertyId, setPropertyId] = useState<string | null>(null);

  useEffect(() => {
    const props = properties as { id: string }[] | null;
    if (props && props.length > 0 && !propertyId) setPropertyId(props[0].id);
  }, [properties, propertyId]);

  const { data, isLoading } = useDashboard(propertyId);

  if (isLoading || !data) return <PageLoader />;

  const stats = data.stats as {
    totalRooms: number; availableRooms: number; occupiedRooms: number;
    monthlyRevenue: number; occupancyRate: number; pendingBookings: number;
  };

  const revenueData = data.revenueChart as { date: string; revenue: number }[];
  const channelData = data.channelDistribution as { source: string; count: number; revenue: number }[];

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalBookings = channelData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500">Performance overview</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Revenue" value={formatCurrency(totalRevenue)} subtitle="Last 30 days" icon={DollarSign} color="green" />
        <StatsCard title="Total Bookings" value={totalBookings} subtitle="Last 30 days" icon={Users} color="blue" />
        <StatsCard title="Occupancy Rate" value={`${stats.occupancyRate}%`} icon={TrendingUp} color="purple" />
        <StatsCard title="Available Rooms" value={stats.availableRooms} subtitle={`of ${stats.totalRooms} total`} icon={BarChart2} color="yellow" />
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Channel Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bookings by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {channelData.map((_, i) => (
                    <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={channelData} dataKey="revenue" nameKey="source" cx="50%" cy="50%" outerRadius={90}>
                  {channelData.map((_, i) => (
                    <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
