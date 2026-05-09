"use client";

import { BedDouble, Edit, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ROOM_STATUS_COLORS, ROOM_STATUS_LABELS } from "@/config/constants";
import { formatCurrency } from "@/lib/utils";

interface RoomCardProps {
  room: {
    id: string;
    name: string;
    roomNumber: string;
    floorNumber?: number | null;
    status: string;
    basePrice: string | number;
    roomType: { name: string; amenities: string[] };
    _count?: { bookings: number };
  };
  onEdit: (room: RoomCardProps["room"]) => void;
  onDelete: (id: string) => void;
  onCopyIcal: (id: string) => void;
}

export function RoomCard({ room, onEdit, onDelete, onCopyIcal }: RoomCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <BedDouble className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{room.name}</h3>
            <p className="text-xs text-gray-400">
              Room {room.roomNumber}
              {room.floorNumber != null && ` · Floor ${room.floorNumber}`}
            </p>
          </div>
        </div>
        <Badge className={ROOM_STATUS_COLORS[room.status]}>
          {ROOM_STATUS_LABELS[room.status] ?? room.status}
        </Badge>
      </div>

      {/* Room type & amenities */}
      <div className="mt-3">
        <p className="text-sm font-medium text-gray-700">{room.roomType.name}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {room.roomType.amenities.slice(0, 4).map((a) => (
            <span key={a} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {a}
            </span>
          ))}
          {room.roomType.amenities.length > 4 && (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              +{room.roomType.amenities.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Price & Stats */}
      <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
        <div>
          <p className="text-base font-bold text-gray-900">
            {formatCurrency(Number(room.basePrice))}
          </p>
          <p className="text-xs text-gray-400">per night</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-700">
            {room._count?.bookings ?? 0}
          </p>
          <p className="text-xs text-gray-400">active bookings</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(room)} className="flex-1">
          <Edit className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Copy iCal URL"
          onClick={() => onCopyIcal(room.id)}
          className="text-gray-400 hover:text-gray-700"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(room.id)}
          className="text-red-400 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
