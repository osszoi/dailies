"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { NoteDetail } from "@/lib/types";
import MarkdownEditor from "@/components/MarkdownEditor";

interface Props {
  note: NoteDetail | null;
  isNew: boolean;
  saving: boolean;
  onSave: (content: string) => Promise<void>;
}

function formatFullTimestamp(id: string): string {
  try {
    const iso = id.replace(
      /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})$/,
      "$1T$2:$3:$4"
    );
    const date = new Date(iso);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return id;
  }
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseProcessedContent(content: string) {
  const lines = content.split("\n");
  const first = lines[0] ?? "";
  if (first.startsWith("title: ")) {
    return { title: first.slice(7).trim(), body: lines.slice(1).join("\n") };
  }
  return { title: first, body: lines.slice(1).join("\n") };
}

export default function Editor({ note, isNew, saving, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [, setTick] = useState(0);
  const isProcessed = !isNew && note?.type === "processed";

  const dirtyRef = useRef(false);
  const handleSaveRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);

  // tick every second to update "X ago" label
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isNew) {
      setTitle("");
      setBody("");
      setDirty(false);
      setLastSaved(null);
      return;
    }
    if (!note) return;

    if (note.type === "processed") {
      const parsed = parseProcessedContent(note.content);
      setTitle(parsed.title);
      setBody(parsed.body);
    } else {
      setTitle("");
      setBody(note.content);
    }
    setDirty(false);
    setLastSaved(null);
  }, [note, isNew]);

  const buildContent = useCallback(() => {
    if (isProcessed) return `title: ${title}\n${body}`;
    return body;
  }, [isProcessed, title, body]);

  const handleSave = useCallback(async () => {
    const content = buildContent();
    if (!content.trim() && !title.trim()) return;
    await onSave(content);
    setDirty(false);
    setLastSaved(new Date());
  }, [buildContent, title, onSave]);

  useEffect(() => { handleSaveRef.current = handleSave; }, [handleSave]);

  // auto-save every 10s for existing notes
  useEffect(() => {
    if (isNew) return;
    const interval = setInterval(() => {
      if (dirtyRef.current) handleSaveRef.current();
    }, 10_000);
    return () => clearInterval(interval);
  }, [isNew]);

  const handleGlobalKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  const fullContent = buildContent();
  const charCount = fullContent.length;
  const wordCount = fullContent.trim().split(/\s+/).filter(Boolean).length;

  if (!isNew && !note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="text-5xl mb-4 opacity-20 select-none">📝</div>
        <p className="text-[#555] text-sm">Select a note or create a new one</p>
      </div>
    );
  }

  const isRaw = note?.type === "raw";

  return (
    <div className="flex-1 flex flex-col h-full min-w-0" onKeyDown={handleGlobalKeyDown}>
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/5 shrink-0">
        <div className="min-w-0">
          {isNew ? (
            <p className="text-sm text-[#555]">New note</p>
          ) : note ? (
            <div className="flex items-center gap-3">
              <p className="text-xs text-[#555] font-mono">
                {formatFullTimestamp(note.id)}
              </p>
              {isRaw && (
                <span className="text-[9px] font-bold tracking-widest text-amber-400 border border-amber-400/50 bg-amber-400/10 px-1.5 py-0.5 rounded uppercase">
                  RAW
                </span>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isNew ? (
            <button
              onClick={handleSave}
              disabled={saving || !body.trim()}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-[#4a9eff] hover:bg-[#5aadff] text-white"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          ) : (
            <span className="text-[11px] font-mono text-[#555]">
              {saving
                ? "Saving…"
                : dirty
                ? "unsaved"
                : lastSaved
                ? `Saved ${timeAgo(lastSaved)}`
                : ""}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {isProcessed && (
          <div className="px-8 pt-6 pb-2 shrink-0 border-b border-white/5">
            <input
              value={title}
              onChange={e => { setTitle(e.target.value); setDirty(true); }}
              onKeyDown={handleGlobalKeyDown}
              placeholder="Note title…"
              className="w-full bg-transparent text-2xl font-bold text-white outline-none placeholder:text-[#333]"
            />
          </div>
        )}

        <MarkdownEditor
          value={body}
          onChange={v => { setBody(v); setDirty(true); }}
          placeholder={isNew ? "Start writing your notes…" : undefined}
          autoFocus={isNew}
          onGlobalKeyDown={handleGlobalKeyDown}
        />
      </div>

      <div className="px-8 py-3 border-t border-white/5 shrink-0 flex items-center justify-between">
        <p className="text-[10px] text-[#444] font-mono">
          {charCount} chars · {wordCount} words
        </p>
        <p className="text-[10px] text-[#444]">⌘S to save</p>
      </div>
    </div>
  );
}
