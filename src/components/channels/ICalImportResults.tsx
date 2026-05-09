"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  CalendarDays,
  AlertTriangle,
  FlaskConical,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { getChannelConfig } from "@/config/channels";

// ─── Demo Test Data ───────────────────────────────────────────────────────────
// Hardcoded realistic events for the "Sample Data" demo card.
// Dates are fixed around March 2026. No API call needed — instant display.

// These events mirror the Airbnb bookings that are seeded in the database,
// so the Channels tab and the Calendar tab show consistent data.
const DEMO_EVENTS: ParsedEvent[] = [
  {
    uid: "airbnb-PAST-101-FEB",
    summary: "Airbnb – Room 101 (checked out)",
    start: "2026-02-27T00:00:00.000Z",
    end: "2026-03-02T00:00:00.000Z",
    description: "Airbnb reservation | Room 101 | 3 nights",
    nights: 3,
  },
  {
    uid: "airbnb-PAST-301-MAR",
    summary: "Airbnb – Room 301 (checked out)",
    start: "2026-03-11T00:00:00.000Z",
    end: "2026-03-14T00:00:00.000Z",
    description: "Airbnb reservation | Room 301 | 3 nights",
    nights: 3,
  },
  {
    uid: "airbnb-ACTIVE-101-MAR18",
    summary: "Airbnb – Room 101 (currently staying)",
    start: "2026-03-18T00:00:00.000Z",
    end: "2026-03-21T00:00:00.000Z",
    description: "Airbnb reservation | Room 101 | Guest checked in | 3 nights",
    nights: 3,
  },
  {
    uid: "airbnb-UPCOMING-102-MAR21",
    summary: "Airbnb – Room 102 (confirmed)",
    start: "2026-03-21T00:00:00.000Z",
    end: "2026-03-24T00:00:00.000Z",
    description: "Airbnb reservation | Room 102 | Upcoming | 3 nights",
    nights: 3,
  },
  {
    uid: "airbnb-UPCOMING-302-MAR29",
    summary: "Airbnb – Room 302 (confirmed)",
    start: "2026-03-29T00:00:00.000Z",
    end: "2026-04-03T00:00:00.000Z",
    description: "Airbnb reservation | Room 302 | Upcoming | 5 nights",
    nights: 5,
  },
  {
    uid: "airbnb-UPCOMING-101-APR",
    summary: "Airbnb – Room 101 (confirmed)",
    start: "2026-04-10T00:00:00.000Z",
    end: "2026-04-14T00:00:00.000Z",
    description: "Airbnb reservation | Room 101 | April booking | 4 nights",
    nights: 4,
  },
  {
    uid: "airbnb-UPCOMING-302-MAY",
    summary: "Airbnb – Room 302 (confirmed)",
    start: "2026-05-02T00:00:00.000Z",
    end: "2026-05-07T00:00:00.000Z",
    description: "Airbnb reservation | Room 302 | Labour Day week | 5 nights",
    nights: 5,
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ICalChannel {
  id: string;
  name: string;
  type: string;
  icalUrl: string | null;
  isActive: boolean;
}

interface ParsedEvent {
  uid: string;
  summary: string;
  start: string;
  end: string;
  description: string | null;
  nights: number;
}

type TestStatus = "idle" | "loading" | "success" | "error";

interface ChannelTestState {
  status: TestStatus;
  count: number;
  events: ParsedEvent[];
  error: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function isUpcoming(iso: string) {
  return new Date(iso) > new Date();
}

// ─── Event Row ────────────────────────────────────────────────────────────────

function EventRow({ ev, index }: { ev: ParsedEvent; index: number }) {
  const upcoming = isUpcoming(ev.start);
  const today = isToday(ev.start);

  return (
    <tr
      className={`border-b border-gray-100 text-sm transition-colors last:border-0 ${
        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
      } hover:bg-indigo-50/30`}
    >
      <td className="px-4 py-3">
        <span className="font-medium text-gray-800 leading-tight line-clamp-1">
          {ev.summary}
        </span>
        {ev.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{ev.description}</p>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex flex-col gap-0.5">
          <span className={today ? "font-semibold text-orange-600" : "text-gray-700"}>
            {fmtDate(ev.start)}
          </span>
          {today && (
            <span className="text-[10px] font-medium text-orange-500 uppercase">Today</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{fmtDate(ev.end)}</td>
      <td className="px-4 py-3 text-center">
        <span className="inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
          {ev.nights}n
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {upcoming ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
            Upcoming
          </span>
        ) : (
          <span className="text-xs text-gray-400">Past</span>
        )}
      </td>
    </tr>
  );
}

// ─── Channel Result Card ──────────────────────────────────────────────────────

function ChannelResultCard({
  channel,
  state,
  onRetest,
}: {
  channel: ICalChannel;
  state: ChannelTestState;
  onRetest: (id: string) => void;
}) {
  const config = getChannelConfig(channel.type);
  const [expanded, setExpanded] = useState(true);

  const upcomingCount = state.events.filter((e) => isUpcoming(e.start)).length;
  const pastCount = state.events.length - upcomingCount;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Card Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors select-none"
        onClick={() => state.status !== "loading" && setExpanded((v) => !v)}
      >
        {/* Logo */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${config.bgColor}`}
        >
          {config.logo}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{channel.name}</span>
            <span className="text-xs text-gray-400">{config.label}</span>
            {!channel.isActive && (
              <Badge variant="warning">Inactive</Badge>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {channel.icalUrl ?? "No iCal URL configured"}
          </p>
        </div>

        {/* Status */}
        <div className="flex shrink-0 items-center gap-3">
          {state.status === "loading" && (
            <div className="flex items-center gap-1.5 text-sm text-indigo-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Parsing…</span>
            </div>
          )}
          {state.status === "success" && (
            <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>{state.count} event{state.count !== 1 ? "s" : ""}</span>
            </div>
          )}
          {state.status === "error" && (
            <div className="flex items-center gap-1.5 text-sm text-red-500 font-medium">
              <XCircle className="h-4 w-4" />
              <span>Failed</span>
            </div>
          )}
          {state.status === "idle" && (
            <span className="text-xs text-gray-400">No URL</span>
          )}

          {state.status !== "loading" && state.status !== "idle" && (
            <button
              onClick={(e) => { e.stopPropagation(); onRetest(channel.id); }}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Re-run test"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}

          {state.status !== "loading" && state.status !== "idle" && (
            expanded
              ? <ChevronDown className="h-4 w-4 text-gray-400" />
              : <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Card Body */}
      {expanded && (
        <>
          {/* Error */}
          {state.status === "error" && (
            <div className="mx-5 mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {/* No URL */}
          {state.status === "idle" && (
            <div className="mx-5 mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>No iCal URL is configured for this channel. Add one from the channel settings.</span>
            </div>
          )}

          {/* Loading skeleton */}
          {state.status === "loading" && (
            <div className="space-y-2 px-5 pb-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          )}

          {/* Events Table */}
          {state.status === "success" && state.count === 0 && (
            <div className="flex flex-col items-center gap-2 pb-8 text-center text-sm text-gray-400">
              <CalendarDays className="h-8 w-8 text-gray-200" />
              <p>Calendar is empty — no blocked dates found.</p>
            </div>
          )}

          {state.status === "success" && state.count > 0 && (
            <div>
              {/* Mini stats bar */}
              <div className="flex items-center gap-4 border-t border-b border-gray-100 bg-gray-50/70 px-5 py-2 text-xs text-gray-500">
                <span>
                  <strong className="text-green-600">{upcomingCount}</strong> upcoming
                </span>
                <span>
                  <strong className="text-gray-500">{pastCount}</strong> past
                </span>
                <span className="ml-auto text-gray-400">
                  Total blocked nights:{" "}
                  <strong className="text-gray-700">
                    {state.events.reduce((s, e) => s + e.nights, 0)}
                  </strong>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-2.5">Summary / Description</th>
                      <th className="px-4 py-2.5">Check-in</th>
                      <th className="px-4 py-2.5">Check-out</th>
                      <th className="px-4 py-2.5 text-center">Nights</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.events.map((ev, i) => (
                      <EventRow key={ev.uid} ev={ev} index={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Demo Result Card ─────────────────────────────────────────────────────────

function DemoResultCard() {
  const [expanded, setExpanded] = useState(true);
  const upcomingCount = DEMO_EVENTS.filter((e) => isUpcoming(e.start)).length;
  const pastCount = DEMO_EVENTS.length - upcomingCount;
  const totalNights = DEMO_EVENTS.reduce((s, e) => s + e.nights, 0);

  return (
    <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-indigo-50/50 transition-colors select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-lg">
          <FlaskConical className="h-5 w-5 text-indigo-500" />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">
              Grand Pearl Hotel – Room 101
            </span>
            <Badge variant="info">Sample Data</Badge>
            <span className="text-xs text-gray-400">Airbnb · Vrbo · Direct</span>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">
            /api/ical/demo · 11 simulated bookings (Feb–Jun 2026)
          </p>
        </div>

        {/* Count + toggle */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            <span>{DEMO_EVENTS.length} events</span>
          </div>
          <a
            href="/api/ical/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1.5 text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
            title="Open raw .ics feed"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {expanded
            ? <ChevronDown className="h-4 w-4 text-gray-400" />
            : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div>
          {/* Stats bar */}
          <div className="flex items-center gap-4 border-t border-b border-indigo-100 bg-white/60 px-5 py-2 text-xs text-gray-500">
            <span>
              <strong className="text-green-600">{upcomingCount}</strong> upcoming
            </span>
            <span>
              <strong className="text-gray-500">{pastCount}</strong> past
            </span>
            <span className="ml-auto text-gray-400">
              Total blocked nights:{" "}
              <strong className="text-gray-700">{totalNights}</strong>
            </span>
            <span className="text-indigo-400 font-medium">
              ★ Demo — replace with your real iCal URL
            </span>
          </div>

          <div className="overflow-x-auto bg-white/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-indigo-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-indigo-500">
                  <th className="px-4 py-2.5">Summary / Source</th>
                  <th className="px-4 py-2.5">Check-in</th>
                  <th className="px-4 py-2.5">Check-out</th>
                  <th className="px-4 py-2.5 text-center">Nights</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_EVENTS.map((ev, i) => (
                  <EventRow key={ev.uid} ev={ev} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function ICalImportResults({ channels }: { channels: ICalChannel[] }) {
  const icalChannels = channels.filter(
    (c) => ["AIRBNB", "ICAL"].includes(c.type)
  );

  const [states, setStates] = useState<Record<string, ChannelTestState>>(() => {
    const init: Record<string, ChannelTestState> = {};
    for (const ch of icalChannels) {
      init[ch.id] = {
        status: ch.icalUrl ? "loading" : "idle",
        count: 0,
        events: [],
        error: null,
      };
    }
    return init;
  });

  const runTest = useCallback(async (channel: ICalChannel) => {
    if (!channel.icalUrl) return;

    setStates((prev) => ({
      ...prev,
      [channel.id]: { status: "loading", count: 0, events: [], error: null },
    }));

    try {
      const res = await fetch("/api/ical/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icalUrl: channel.icalUrl }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setStates((prev) => ({
          ...prev,
          [channel.id]: {
            status: "error",
            count: 0,
            events: [],
            error: json.error ?? "Failed to parse iCal feed",
          },
        }));
      } else {
        setStates((prev) => ({
          ...prev,
          [channel.id]: {
            status: "success",
            count: json.data.count,
            events: json.data.events,
            error: null,
          },
        }));
      }
    } catch {
      setStates((prev) => ({
        ...prev,
        [channel.id]: {
          status: "error",
          count: 0,
          events: [],
          error: "Network error — could not reach the server",
        },
      }));
    }
  }, []);

  // Auto-run all tests on mount (and when channels change)
  useEffect(() => {
    for (const ch of icalChannels) {
      if (ch.icalUrl) {
        runTest(ch);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels.map((c) => c.id).join(",")]);

  const handleRetest = (channelId: string) => {
    const ch = icalChannels.find((c) => c.id === channelId);
    if (ch) runTest(ch);
  };

  const handleRetestAll = () => {
    for (const ch of icalChannels) runTest(ch);
  };

  const loadingCount = Object.values(states).filter((s) => s.status === "loading").length;
  const successCount = Object.values(states).filter((s) => s.status === "success").length;
  const errorCount = Object.values(states).filter((s) => s.status === "error").length;
  const totalEvents = Object.values(states).reduce((s, st) => s + st.count, 0);

  const hasRealChannels = icalChannels.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-indigo-500" />
            iCal Import Test Results
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {hasRealChannels
              ? loadingCount > 0
                ? `Testing ${loadingCount} channel${loadingCount !== 1 ? "s" : ""}…`
                : `${successCount} channel${successCount !== 1 ? "s" : ""} tested · ${totalEvents} total events${errorCount > 0 ? ` · ${errorCount} failed` : ""}`
              : "No iCal channels added yet — showing demo data below"}
          </p>
        </div>
        {hasRealChannels && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetestAll}
            disabled={loadingCount > 0}
          >
            {loadingCount > 0 ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {loadingCount > 0 ? "Running…" : "Re-run All"}
          </Button>
        )}
      </div>

      {/* Demo Card — always shown at top */}
      <DemoResultCard />

      {/* Real channel cards */}
      {hasRealChannels && (
        <div className="flex flex-col gap-3">
          {icalChannels.map((ch) => (
            <ChannelResultCard
              key={ch.id}
              channel={ch}
              state={states[ch.id] ?? { status: "idle", count: 0, events: [], error: null }}
              onRetest={handleRetest}
            />
          ))}
        </div>
      )}

      {/* Tip when no real channels */}
      {!hasRealChannels && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs text-indigo-600">
          <strong>Add a real channel above</strong> — click "Add Channel", choose Airbnb or
          iCal (Generic), paste your iCal URL, and it will appear here automatically tested.
        </div>
      )}
    </div>
  );
}
