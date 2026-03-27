"use client";

import { useState, useEffect, useMemo } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import NotePreview from "@/components/NotePreview";
import { Task, NoteDetail } from "@/lib/types";

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [previewNote, setPreviewNote] = useState<NoteDetail | null>(null);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => { setTasks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return tasks;
    const q = search.toLowerCase();
    return tasks.filter(
      (t) =>
        t.text.toLowerCase().includes(q) ||
        (t.noteTitle?.toLowerCase().includes(q) ?? false)
    );
  }, [tasks, search]);

  const pendingTasks = useMemo(() => filtered.filter((t) => !t.checked), [filtered]);
  const doneTasks = useMemo(() => filtered.filter((t) => t.checked), [filtered]);

  async function handleViewSource(task: Task) {
    setSelectedTask(task);
    const res = await fetch(`/api/notes/${task.noteId}`);
    const note: NoteDetail = await res.json();
    setPreviewNote(note);
  }

  async function handleToggle(task: Task, checked: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, checked } : t)));

    await fetch(`/api/notes/${task.noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineIndex: task.lineIndex, checked }),
    });

    if (previewNote?.id === task.noteId) {
      const res = await fetch(`/api/notes/${task.noteId}`);
      setPreviewNote(await res.json());
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#555] text-sm">
        Loading tasks…
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-6 py-3 border-b border-white/5 shrink-0 flex items-center gap-4">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555]"
            width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-56 bg-[#1a1a1a] border border-white/10 rounded-full pl-7 pr-3 py-1.5 text-[12px] text-[#ccc] placeholder:text-[#444] outline-none focus:border-white/20 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#999] cursor-pointer"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-[11px] text-[#444]">
          {pendingTasks.length} pending · {doneTasks.length} done
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 overflow-y-auto p-5 border-r border-white/5">
          <KanbanBoard
            pendingTasks={pendingTasks}
            doneTasks={doneTasks}
            selectedTaskId={selectedTask?.id ?? null}
            onViewSource={handleViewSource}
            onToggle={handleToggle}
          />
        </div>

        <div className="w-1/2 overflow-hidden flex flex-col">
          {previewNote && selectedTask ? (
            <NotePreview note={previewNote} task={selectedTask} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[#3a3a3a] text-sm">hover a card and click "view source →"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
