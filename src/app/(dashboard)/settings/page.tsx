"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useSession } from "next-auth/react";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "system", label: "System", icon: Database },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [profile, setProfile] = useState({
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
  });

  // Notification prefs
  const [notifs, setNotifs] = useState({
    newBooking: true,
    cancellation: true,
    syncError: true,
    dailySummary: false,
    weeklyReport: true,
    lowAvailability: true,
  });

  // Password change
  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  // Appearance
  const [appearance, setAppearance] = useState({
    theme: "light",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    language: "en",
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate save
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account preferences and system configuration
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                    {profile.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{profile.name}</p>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full capitalize">
                      {(session?.user as { role?: string })?.role?.toLowerCase() ?? "user"}
                    </span>
                  </div>
                </div>
                <Input
                  label="Full Name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSave} isLoading={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "newBooking", label: "New Booking", desc: "Get notified when a new booking is received" },
                  { key: "cancellation", label: "Cancellation", desc: "Get notified when a booking is cancelled" },
                  { key: "syncError", label: "Sync Errors", desc: "Alert on channel sync failures" },
                  { key: "dailySummary", label: "Daily Summary", desc: "Receive daily occupancy and revenue summary" },
                  { key: "weeklyReport", label: "Weekly Report", desc: "Weekly analytics report every Monday" },
                  { key: "lowAvailability", label: "Low Availability", desc: "Alert when rooms are nearly fully booked" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifs({ ...notifs, [key]: !notifs[key as keyof typeof notifs] })}
                      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                        notifs[key as keyof typeof notifs] ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          notifs[key as keyof typeof notifs] ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} isLoading={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    label="Current Password"
                    type={showCurrentPw ? "text" : "password"}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showNewPw ? "text" : "password"}
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowNewPw(!showNewPw)}
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                />
                {passwords.newPassword && passwords.confirm && passwords.newPassword !== passwords.confirm && (
                  <p className="text-sm text-red-500">Passwords do not match</p>
                )}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    isLoading={saving}
                    disabled={
                      !passwords.current ||
                      !passwords.newPassword ||
                      passwords.newPassword !== passwords.confirm
                    }
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance & Localization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Theme"
                  value={appearance.theme}
                  onChange={(e) => setAppearance({ ...appearance, theme: e.target.value })}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark (coming soon)</option>
                  <option value="system">System Default</option>
                </Select>
                <Select
                  label="Date Format"
                  value={appearance.dateFormat}
                  onChange={(e) => setAppearance({ ...appearance, dateFormat: e.target.value })}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </Select>
                <Select
                  label="Time Format"
                  value={appearance.timeFormat}
                  onChange={(e) => setAppearance({ ...appearance, timeFormat: e.target.value })}
                >
                  <option value="12h">12-hour (AM/PM)</option>
                  <option value="24h">24-hour</option>
                </Select>
                <Select
                  label="Language"
                  value={appearance.language}
                  onChange={(e) => setAppearance({ ...appearance, language: e.target.value })}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </Select>
                <div className="flex justify-end">
                  <Button onClick={handleSave} isLoading={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Tab */}
          {activeTab === "system" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3 text-sm">
                    {[
                      { label: "Application", value: "Hotel Channel Manager" },
                      { label: "Version", value: "1.0.0" },
                      { label: "Framework", value: "Next.js 16 (App Router)" },
                      { label: "Database", value: "PostgreSQL + Prisma ORM" },
                      { label: "Auth", value: "NextAuth v5" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                        <dt className="text-gray-500">{label}</dt>
                        <dd className="font-medium text-gray-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Supported Channels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {["Airbnb", "Booking.com", "Goibibo", "MakeMyTrip", "Agoda", "Expedia"].map((ch) => (
                      <span
                        key={ch}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
