"use client";

import { RefreshCw, Power, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getChannelConfig } from "@/config/channels";
import { formatDate } from "@/lib/utils";
import { SYNC_STATUS_COLORS } from "@/config/constants";
import { useState } from "react";

interface ChannelCardProps {
  channel: {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    icalUrl?: string | null;
    syncStatus: string;
    lastSyncAt: Date | null;
    _count?: { bookings: number };
  };
  onSync: (id: string) => Promise<void>;
  onToggle: (id: string, active: boolean) => Promise<void>;
  onDelete: (id: string) => void;
}

export function ChannelCard({ channel, onSync, onToggle, onDelete }: ChannelCardProps) {
  const config = getChannelConfig(channel.type);
  const [syncing, setSyncing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try { await onSync(channel.id); } finally { setSyncing(false); }
  };

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(channel.id, !channel.isActive); } finally { setToggling(false); }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${config.bgColor}`}>
            {config.logo}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{channel.name}</h3>
            <p className="text-xs text-gray-400">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge
            className={SYNC_STATUS_COLORS[channel.syncStatus]}
            variant="outline"
          >
            {channel.syncStatus}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{channel._count?.bookings ?? 0}</p>
          <p className="text-xs text-gray-500">Bookings</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">{config.commissionRange}</p>
          <p className="text-xs text-gray-500">Commission</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium text-gray-700">
            {channel.lastSyncAt ? formatDate(channel.lastSyncAt) : "Never"}
          </p>
          <p className="text-xs text-gray-500">Last sync</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <Button
          variant={channel.isActive ? "outline" : "default"}
          size="sm"
          isLoading={toggling}
          onClick={handleToggle}
          className="flex-1"
        >
          <Power className="h-3.5 w-3.5" />
          {channel.isActive ? "Disable" : "Enable"}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          isLoading={syncing}
          onClick={handleSync}
          disabled={!channel.isActive}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(channel.id)}
          className="text-red-400 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Integration method */}
      <p className="mt-3 text-xs text-gray-400 text-center">
        Integration: {config.integrationMethod}
        {config.requiresPartnerAccess && " · Requires partner access"}
      </p>
      {channel.icalUrl && (
        <p className="mt-1 truncate text-center text-[10px] text-blue-400 font-mono" title={channel.icalUrl}>
          {channel.icalUrl}
        </p>
      )}
    </div>
  );
}
