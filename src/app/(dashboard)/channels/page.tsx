"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { ChannelCard } from "@/components/channels/ChannelCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useChannels, useProperties } from "@/hooks/useChannels";
import { useRooms } from "@/hooks/useRooms";
import { CHANNEL_CONFIGS } from "@/config/channels";
import { ICalImportResults } from "@/components/channels/ICalImportResults";

const CHANNEL_TYPE_OPTIONS = Object.values(CHANNEL_CONFIGS).map((c) => ({
  value: c.type,
  label: c.label,
}));

export default function ChannelsPage() {
  const { data: properties } = useProperties();
  const [propertyId, setPropertyId] = useState<string | null>(null);

  useEffect(() => {
    const props = properties as { id: string }[] | null;
    if (props && props.length > 0 && !propertyId) setPropertyId(props[0].id);
  }, [properties, propertyId]);

  const { channels, isLoading, syncChannel, toggleChannel, deleteChannel, addChannel } =
    useChannels(propertyId);
  const { rooms } = useRooms(propertyId);

  const [modalOpen, setModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({ name: "", type: "AIRBNB", icalUrl: "" });

  const handleAdd = async () => {
    if (!propertyId) return;
    await addChannel({ ...form, propertyId });
    setModalOpen(false);
    setForm({ name: "", type: "AIRBNB", icalUrl: "" });
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    const chList = channels as { id: string }[];
    await Promise.allSettled(chList.map((c) => syncChannel(c.id)));
    setSyncing(false);
  };

  if (isLoading) return <PageLoader />;

  type Channel = {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    icalUrl: string | null;
    syncStatus: string;
    lastSyncAt: Date | null;
    _count?: { bookings: number };
  };

  const channelList = channels as Channel[];
  const activeCount = channelList.filter((c) => c.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Channel Manager</h2>
          <p className="text-sm text-gray-500">
            {channelList.length} channels · {activeCount} active
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSyncAll}
            isLoading={syncing}
            disabled={activeCount === 0}
          >
            <RefreshCw className="h-4 w-4" />
            Sync All
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Channel
          </Button>
        </div>
      </div>

      {/* Integration info banner */}
      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="py-4">
          <p className="text-sm text-blue-700">
            <strong>iCal channels</strong> (Airbnb, generic) sync instantly via calendar URL.{" "}
            <strong>API channels</strong> (Booking.com, Goibibo, Expedia) require partner
            registration — add your credentials in the channel settings once approved.
          </p>
        </CardContent>
      </Card>

      {/* Channel grid */}
      {channelList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-gray-500">No channels connected yet.</p>
          <Button className="mt-4" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add First Channel
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channelList.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onSync={syncChannel}
              onToggle={toggleChannel}
              onDelete={deleteChannel}
            />
          ))}
        </div>
      )}

      {/* iCal Import Test Results — auto-runs for all iCal/Airbnb channels, shows demo data always */}
      <ICalImportResults channels={channelList} />

      {/* Add Channel Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New Channel">
        <div className="flex flex-col gap-4">
          <Select
            label="Channel Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value, name: CHANNEL_CONFIGS[e.target.value]?.label ?? "" })}
            options={CHANNEL_TYPE_OPTIONS}
          />
          <Input
            label="Display Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={CHANNEL_CONFIGS[form.type]?.label ?? "Channel name"}
            required
          />
          {["AIRBNB", "ICAL"].includes(form.type) && (
            <Input
              label="iCal URL (from OTA)"
              value={form.icalUrl}
              onChange={(e) => setForm({ ...form, icalUrl: e.target.value })}
              placeholder="https://www.airbnb.com/calendar/ical/..."
              hint="Paste the iCal export URL from the OTA's calendar settings"
            />
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Channel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
