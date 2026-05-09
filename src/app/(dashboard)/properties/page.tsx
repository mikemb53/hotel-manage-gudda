"use client";

import { useState } from "react";
import { Building2, Plus, MapPin, Phone, Mail, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { useProperties } from "@/hooks/useChannels";
import { PageLoader } from "@/components/ui/Spinner";
import { CURRENCIES, TIMEZONES } from "@/config/constants";
import type { Property } from "@/types";

export default function PropertiesPage() {
  const { properties: rawProperties, isLoading, createProperty } = useProperties();
  const properties = rawProperties as Property[];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    phone: "",
    email: "",
    website: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createProperty(form);
      setIsModalOpen(false);
      setForm({
        name: "",
        address: "",
        city: "",
        state: "",
        country: "India",
        postalCode: "",
        phone: "",
        email: "",
        website: "",
        currency: "INR",
        timezone: "Asia/Kolkata",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        description: "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your hotel properties and locations
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No properties yet
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Add your first property to start managing room availability.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{property.name}</CardTitle>
                      <Badge variant="success" className="mt-1 text-xs">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                  <span>
                    {property.address}, {property.city}, {property.state},{" "}
                    {property.country}
                  </span>
                </div>
                {property.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <span>{property.phone}</span>
                  </div>
                )}
                {property.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <span>{property.email}</span>
                  </div>
                )}
                {property.website && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <a
                      href={property.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {property.website}
                    </a>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Check-in</p>
                    <p className="font-medium">{property.checkInTime ?? "14:00"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Check-out</p>
                    <p className="font-medium">{property.checkOutTime ?? "11:00"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Currency</p>
                    <p className="font-medium">{property.currency ?? "INR"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Timezone</p>
                    <p className="font-medium text-xs">{property.timezone ?? "Asia/Kolkata"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Property"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Property Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. The Grand Palace Hotel"
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of the property..."
            rows={2}
          />
          <Input
            label="Address *"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Street address"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City *"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="City"
              required
            />
            <Input
              label="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="State / Province"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="Country"
            />
            <Input
              label="Postal Code"
              value={form.postalCode}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              placeholder="Postal / ZIP code"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contact@hotel.com"
            />
          </div>
          <Input
            label="Website"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://www.yourhotel.com"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </Select>
            <Select
              label="Timezone"
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Check-in Time"
              type="time"
              value={form.checkInTime}
              onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}
            />
            <Input
              label="Check-out Time"
              type="time"
              value={form.checkOutTime}
              onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Create Property
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
