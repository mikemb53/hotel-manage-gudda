"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle,
  Copy,
  ExternalLink,
  FlaskConical,
  Loader2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ParsedEvent {
  uid: string;
  summary: string;
  start: string;
  end: string;
  description: string | null;
  nights: number;
}

interface TestResult {
  url: string;
  count: number;
  events: ParsedEvent[];
}

interface Room {
  id: string;
  name: string;
  roomNumber?: string;
}

interface ICalTesterProps {
  /** Rooms belonging to the current property — used to generate export feed URLs */
  rooms?: Room[];
  /** Base URL of the app (e.g. https://yourdomain.com) used to build feed URLs */
  baseUrl?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <CheckCircle className="h-3 w-3 text-green-500" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ICalTester({ rooms = [], baseUrl }: ICalTesterProps) {
  const [tab, setTab] = useState<"import" | "export">("import");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const origin =
    baseUrl ??
    (typeof window !== "undefined" ? window.location.origin : "");

  // ── Test Import ────────────────────────────────────────────────────────────
  const handleTest = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/ical/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icalUrl: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to parse iCal feed");
      } else {
        setResult(json.data as TestResult);
      }
    } catch {
      setError("Network error — could not reach the server");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
        <FlaskConical className="h-5 w-5 text-indigo-500" />
        <h3 className="font-semibold text-gray-800">iCal Integration Tester</h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(["import", "export"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "import" ? "🔗 Test Import URL" : "📤 Your Export Feeds"}
          </button>
        ))}
      </div>

      {/* Tab: Test Import URL */}
      {tab === "import" && (
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            Paste any iCal URL (Airbnb, Vrbo, Booking.com, etc.) to preview what
            events would be imported — without saving anything.
          </p>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="https://www.airbnb.com/calendar/ical/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTest()}
              />
            </div>
            <Button
              onClick={handleTest}
              disabled={!url.trim() || loading}
              className="shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="h-4 w-4" />
              )}
              {loading ? "Testing…" : "Test"}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="flex flex-col gap-3">
              {/* Summary bar */}
              <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-4 py-2">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    Feed parsed successfully —{" "}
                    <strong>{result.count} event{result.count !== 1 ? "s" : ""}</strong>{" "}
                    found
                  </span>
                </div>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  View raw feed <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {result.count === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">
                  No events found in this feed. The calendar may be empty.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                        <th className="px-4 py-2">Summary</th>
                        <th className="px-4 py-2">Check-in</th>
                        <th className="px-4 py-2">Check-out</th>
                        <th className="px-4 py-2">Nights</th>
                        <th className="px-4 py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.events.map((ev) => (
                        <tr key={ev.uid} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[180px] truncate">
                            {ev.summary}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                            {fmt(ev.start)}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                            {fmt(ev.end)}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge variant="default">{ev.nights}n</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-gray-400 max-w-[200px] truncate text-xs">
                            {ev.description ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Export Feeds */}
      {tab === "export" && (
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-gray-500">
            Each room has a unique iCal export URL. Paste these into your OTA
            calendar settings so they stay in sync with your bookings.
          </p>

          {rooms.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
              <Calendar className="h-8 w-8 text-gray-300" />
              <p>No rooms found for this property.</p>
              <p className="text-xs">Add rooms first to generate export feed URLs.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {rooms.map((room) => {
                const feedUrl = `${origin}/api/ical/${room.id}`;
                return (
                  <div
                    key={room.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {room.name}
                        {room.roomNumber && (
                          <span className="ml-2 text-xs text-gray-400">
                            #{room.roomNumber}
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-blue-600 font-mono mt-0.5">
                        {feedUrl}
                      </p>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-1">
                      <CopyButton text={feedUrl} />
                      <a
                        href={feedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-200 transition-colors"
                        title="Open feed"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* OTA setup hints */}
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700 space-y-1">
            <p className="font-semibold">How to use these URLs in OTAs:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>
                <strong>Airbnb:</strong> Calendar → Import calendar → paste URL
              </li>
              <li>
                <strong>Vrbo/HomeAway:</strong> Calendar → Sync calendars → Add calendar
              </li>
              <li>
                <strong>Booking.com:</strong> Availability → iCal → Import URL
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
