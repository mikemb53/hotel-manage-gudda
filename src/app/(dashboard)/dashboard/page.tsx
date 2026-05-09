"use client";

import { useEffect, useState } from "react";
import {
  BedDouble, CalendarCheck, CalendarX, TrendingUp,
  Users, DollarSign, RefreshCw, BarChart2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { StatsCard } from "@/components/analytics/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/Spinner";
import { useDashboard, useProperties } from "@/hooks/useChannels";
import { formatCurrency } from "@/lib/utils";

const CHANNEL_COLORS = [
  "#3b82f6", "#f43f5e", "#f97316", "#a855f7", "#22c55e", "#eab308", "#64748b",
];

export default function DashboardPage() {
  const { data: properties } = useProperties();
  const [propertyId, setPropertyId] = useState<string | null>(null);

  useEffect(() => {
    const props = properties as { id: string }[] | null;
    if (props && props.length > 0 && !propertyId) {
      setPropertyId(props[0].id);
    }
  }, [properties, propertyId]);

  const { data, isLoading } = useDashboard(propertyId);

  if (isLoading || !data) return <PageLoader />;

  const stats = data.stats as {
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    todayCheckIns: number;
    todayCheckOuts: number;
    monthlyRevenue: number;
    occupancyRate: number;
    pendingBookings: number;
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Rooms"
          value={stats.totalRooms}
          subtitle={`${stats.availableRooms} available`}
          icon={BedDouble}
          color="blue"
        />
        <StatsCard
          title="Today Check-ins"
          value={stats.todayCheckIns}
          icon={CalendarCheck}
          color="green"
        />
        <StatsCard
          title="Today Check-outs"
          value={stats.todayCheckOuts}
          icon={CalendarX}
          color="yellow"
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          subtitle="This month"
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Second stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          subtitle={`${stats.occupiedRooms} of ${stats.totalRooms} rooms`}
          icon={TrendingUp}
          color="blue"
        />
        <StatsCard
          title="Pending Bookings"
          value={stats.pendingBookings}
          subtitle="Awaiting confirmation"
          icon={RefreshCw}
          color="yellow"
        />
        <StatsCard
          title="Occupied Rooms"
          value={stats.occupiedRooms}
          icon={Users}
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.revenueChart as { date: string; revenue: number }[]}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.channelDistribution as { source: string; count: number }[]}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {(data.channelDistribution as { source: string }[]).map((_, index) => (
                    <Cell key={index} fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
