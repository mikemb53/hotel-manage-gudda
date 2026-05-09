"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { RoomCard } from "@/components/rooms/RoomCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import { useRooms, useRoomTypes } from "@/hooks/useRooms";
import { useProperties } from "@/hooks/useChannels";
import { APP_NAME } from "@/config/constants";

export default function RoomsPage() {
  const { data: properties } = useProperties();
  const [propertyId, setPropertyId] = useState<string | null>(null);

  useEffect(() => {
    const props = properties as { id: string }[] | null;
    if (props && props.length > 0 && !propertyId) setPropertyId(props[0].id);
  }, [properties, propertyId]);

  const { rooms, isLoading, refetch, createRoom, deleteRoom, isCreating } =
    useRooms(propertyId);
  const { data: roomTypes } = useRoomTypes();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", roomNumber: "", floorNumber: "", basePrice: "", roomTypeId: "",
  });

  const handleCreate = async () => {
    if (!propertyId) return;
    await createRoom({
      ...form,
      floorNumber: form.floorNumber ? Number(form.floorNumber) : undefined,
      basePrice: Number(form.basePrice),
      propertyId,
    });
    setModalOpen(false);
    setForm({ name: "", roomNumber: "", floorNumber: "", basePrice: "", roomTypeId: "" });
    refetch();
  };

  const handleCopyIcal = (roomId: string) => {
    const url = `${window.location.origin}/api/ical/${roomId}`;
    navigator.clipboard.writeText(url);
    alert(`iCal URL copied!\n\nPaste this into your OTA's calendar sync section:\n${url}`);
  };

  if (isLoading) return <PageLoader />;

  const roomList = rooms as {
    id: string; name: string; roomNumber: string; floorNumber?: number | null;
    status: string; basePrice: string | number;
    roomType: { name: string; amenities: string[] };
    _count?: { bookings: number };
  }[];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rooms</h2>
          <p className="text-sm text-gray-500">{roomList.length} rooms configured</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Room
        </Button>
      </div>

      {/* Room grid */}
      {roomList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-gray-500">No rooms yet. Add your first room to get started.</p>
          <Button className="mt-4" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Room
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roomList.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={() => {}}
              onDelete={(id) => { deleteRoom(id); }}
              onCopyIcal={handleCopyIcal}
            />
          ))}
        </div>
      )}

      {/* Add Room Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New Room">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Room Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Deluxe Room 101"
              required
            />
            <Input
              label="Room Number"
              value={form.roomNumber}
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
              placeholder="101"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Floor"
              type="number"
              value={form.floorNumber}
              onChange={(e) => setForm({ ...form, floorNumber: e.target.value })}
              placeholder="1"
            />
            <Input
              label="Base Price (₹)"
              type="number"
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
              placeholder="2500"
              required
            />
          </div>
          <Select
            label="Room Type"
            value={form.roomTypeId}
            onChange={(e) => setForm({ ...form, roomTypeId: e.target.value })}
            options={
              (roomTypes as { id: string; name: string }[] | null)?.map((rt) => ({
                value: rt.id,
                label: rt.name,
              })) ?? []
            }
            placeholder="Select room type"
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={isCreating}>
              Create Room
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
