"use client";

import { useEffect, useState } from "react";
import { Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";
import { useFetch, useMutation } from "@/hooks/useFetch";
import { useRooms } from "@/hooks/useRooms";
import { useProperties } from "@/hooks/useChannels";
import { formatCurrency, formatDate } from "@/lib/utils";

const RATE_TYPE_OPTIONS = [
  { value: "STANDARD", label: "Standard" },
  { value: "WEEKEND", label: "Weekend" },
  { value: "SEASONAL", label: "Seasonal" },
  { value: "PROMOTIONAL", label: "Promotional" },
  { value: "LONG_STAY", label: "Long Stay" },
];

const RATE_TYPE_COLORS: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
  STANDARD: "default",
  WEEKEND: "info",
  SEASONAL: "success",
  PROMOTIONAL: "danger",
  LONG_STAY: "warning",
};

export default function RatesPage() {
  const { data: properties } = useProperties();
  const [propertyId, setPropertyId] = useState<string | null>(null);

  useEffect(() => {
    const props = properties as { id: string }[] | null;
    if (props && props.length > 0 && !propertyId) setPropertyId(props[0].id);
  }, [properties, propertyId]);

  const { rooms } = useRooms(propertyId);
  const [roomFilter, setRoomFilter] = useState("");

  const { data: ratePlans, isLoading, refetch } = useFetch<unknown[]>(
    roomFilter ? `/api/rate-plans?roomId=${roomFilter}` : `/api/rate-plans`
  );

  const createRatePlan = useMutation("/api/rate-plans", "POST");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    roomId: "", name: "", type: "STANDARD", price: "",
    startDate: "", endDate: "", minStay: "1",
  });

  const handleCreate = async () => {
    await createRatePlan.mutate({
      ...form, price: Number(form.price), minStay: Number(form.minStay),
    });
    setModalOpen(false);
    refetch();
  };

  type RatePlan = {
    id: string; name: string; type: string; price: string | number;
    startDate?: string | null; endDate?: string | null;
    minStay: number; isActive: boolean;
    room: { name: string; roomNumber: string };
  };

  const roomList = rooms as { id: string; name: string; roomNumber: string }[];
  const plans = (ratePlans as RatePlan[]) ?? [];

  const columns = [
    { key: "name", header: "Plan Name", render: (r: RatePlan) => (
      <span className="font-medium text-gray-900">{r.name}</span>
    )},
    { key: "room", header: "Room", render: (r: RatePlan) => (
      <span>{r.room?.name ?? "—"}</span>
    )},
    { key: "type", header: "Type", render: (r: RatePlan) => (
      <Badge variant={RATE_TYPE_COLORS[r.type]}>{r.type}</Badge>
    )},
    { key: "price", header: "Price / Night", render: (r: RatePlan) => (
      <span className="font-semibold">{formatCurrency(Number(r.price))}</span>
    )},
    { key: "validity", header: "Validity", render: (r: RatePlan) => (
      <span className="text-xs text-gray-500">
        {r.startDate ? `${formatDate(r.startDate)} → ${formatDate(r.endDate ?? "")}` : "Always"}
      </span>
    )},
    { key: "minStay", header: "Min Stay", render: (r: RatePlan) => (
      <span>{r.minStay} night{r.minStay !== 1 ? "s" : ""}</span>
    )},
    { key: "isActive", header: "Status", render: (r: RatePlan) => (
      <Badge variant={r.isActive ? "success" : "default"}>
        {r.isActive ? "Active" : "Inactive"}
      </Badge>
    )},
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rate Plans</h2>
          <p className="text-sm text-gray-500">{plans.length} plans configured</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          New Rate Plan
        </Button>
      </div>

      {/* Room filter */}
      <div className="flex items-center gap-3">
        <Tag className="h-4 w-4 text-gray-400" />
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
        >
          <option value="">All Rooms</option>
          {roomList.map((r) => (
            <option key={r.id} value={r.id}>{r.name} (#{r.roomNumber})</option>
          ))}
        </select>
      </div>

      <Table
        columns={columns}
        data={plans}
        keyField="id"
        isLoading={isLoading}
        emptyMessage="No rate plans found. Create one to override room base price."
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Rate Plan">
        <div className="flex flex-col gap-4">
          <Select
            label="Room"
            value={form.roomId}
            onChange={(e) => setForm({ ...form, roomId: e.target.value })}
            options={roomList.map((r) => ({ value: r.id, label: `${r.name} (#${r.roomNumber})` }))}
            placeholder="Select room"
            required
          />
          <Input
            label="Plan Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Weekend Special"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={RATE_TYPE_OPTIONS}
            />
            <Input
              label="Price (₹ / night)"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="3500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <Input
            label="Minimum Stay (nights)"
            type="number"
            value={form.minStay}
            onChange={(e) => setForm({ ...form, minStay: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={createRatePlan.isLoading}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
