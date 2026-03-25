"use client";

import { useState, useMemo } from "react";
import { NoteListItem } from "@/lib/types";

interface Props {
  notes: NoteListItem[];
  selectedId: string | null;
  isNewActive: boolean;
  loading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => Promise<void>;
}

function formatTimestamp(id: string): string {
  try {
    const iso = id.replace(
      /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})$/,
      "$1T$2:$3:$4"
    );
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return id;
  }
}

function idToDate(id: string): Date {
  const iso = id.replace(
    /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})$/,
    "$1T$2:$3:$4"
  );
  return new Date(iso);
}

function NoteItem({
  note,
  selected,
  onClick,
  onDelete,
}: {
  note: NoteListItem;
  selected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const isRaw = note.type === "raw";

  return (
    <div
      className={`relative group border-b border-white/5 transition-colors ${
        selected ? "bg-[#3a3a3a]" : "hover:bg-[#282828]"
      }`}
    >
      <button
        onClick={onClick}
        className="w-full text-left px-4 py-3 pr-9 cursor-pointer"
      >
        <div className="text-[10px] text-[#666] mb-1 font-mono">
          {formatTimestamp(note.id)}
        </div>

        {isRaw ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 text-[9px] font-bold tracking-widest text-amber-400 border border-amber-400/50 bg-amber-400/10 px-1.5 py-0.5 rounded uppercase">
              RAW
            </span>
            <p className="text-sm text-[#ccc] truncate leading-snug">{note.preview}</p>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#e8e8e8] truncate leading-snug">
              {note.title}
            </p>
            <p className="text-xs text-[#888] truncate mt-0.5 leading-snug">{note.preview}</p>
          </div>
        )}
      </button>

      {confirming ? (
        <div className="absolute inset-0 flex items-center justify-between px-3 bg-[#2a1a1a] border border-red-900/40 rounded-sm z-10">
          <span className="text-xs text-red-400">Delete?</span>
          <div className="flex gap-2">
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer px-1"
            >
              Yes
            </button>
            <button
              onClick={e => { e.stopPropagation(); setConfirming(false); }}
              className="text-xs text-[#666] hover:text-[#999] cursor-pointer px-1"
            >
              No
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); setConfirming(true); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[#555] hover:text-red-400 p-1"
          title="Delete note"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      )}
    </div>
  );
}

const dateInputClass =
  "w-full bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-[11px] text-[#888] outline-none focus:border-white/20 focus:text-[#ccc] transition-colors [color-scheme:dark] cursor-pointer";

export default function Sidebar({
  notes,
  selectedId,
  isNewActive,
  loading,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = notes;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        n.preview.toLowerCase().includes(q) ||
        n.title?.toLowerCase().includes(q)
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(n => idToDate(n.id) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(n => idToDate(n.id) <= to);
    }

    return result;
  }, [notes, search, dateFrom, dateTo]);

  const hasActiveFilters = search.trim() || dateFrom || dateTo;

  function clearFilters() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <aside className="w-72 shrink-0 flex flex-col bg-[#242424] border-r border-white/5 h-full">
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
        <div>
          <h1 className="text-sm font-semibold text-[#e8e8e8] tracking-tight">Dailies</h1>
          <p className="text-[11px] text-[#555] mt-0.5">Meeting notes</p>
        </div>
        <button
          onClick={onNew}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-lg leading-none transition-colors cursor-pointer ${
            isNewActive
              ? "bg-[#4a9eff] text-white"
              : "bg-[#333] text-[#888] hover:bg-[#3a3a3a] hover:text-[#ccc]"
          }`}
          title="New note"
        >
          +
        </button>
      </div>

      <div className="px-3 py-2 border-b border-white/5 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 text-[#555]" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded pl-6 pr-2 py-1 text-[11px] text-[#ccc] placeholder:text-[#444] outline-none focus:border-white/20 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#999] cursor-pointer"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            title="Filter by date"
            className={`shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors cursor-pointer ${
              showFilters || dateFrom || dateTo
                ? "text-[#4a9eff] bg-[#4a9eff]/10"
                : "text-[#555] hover:text-[#999] hover:bg-white/5"
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-1.5">
            <div className="flex-1">
              <p className="text-[9px] text-[#555] mb-1 uppercase tracking-wider">From</p>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className={dateInputClass}
              />
            </div>
            <div className="flex-1">
              <p className="text-[9px] text-[#555] mb-1 uppercase tracking-wider">To</p>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className={dateInputClass}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-2 bg-[#333] rounded w-24 mb-2" />
                <div className="h-3 bg-[#2e2e2e] rounded w-full mb-1" />
                <div className="h-3 bg-[#2e2e2e] rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[#555] text-sm">
              {hasActiveFilters ? "No matching notes" : "No notes yet"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-[11px] text-[#4a9eff] hover:text-[#5aadff] cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              selected={note.id === selectedId}
              onClick={() => onSelect(note.id)}
              onDelete={() => onDelete(note.id)}
            />
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
        <p className="text-[10px] text-[#444]">
          {hasActiveFilters
            ? `${filtered.length} of ${notes.length} notes`
            : `${notes.length} note${notes.length !== 1 ? "s" : ""}`}
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-[10px] text-[#555] hover:text-[#888] cursor-pointer transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </aside>
  );
}
