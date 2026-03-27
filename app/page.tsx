"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Editor from "@/components/Editor";
import TasksView from "@/components/TasksView";
import { NoteListItem, NoteDetail } from "@/lib/types";

type Tab = "notes" | "tasks";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("notes");
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<NoteDetail | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchNotes = useCallback(async () => {
    const res = await fetch("/api/notes");
    const data: NoteListItem[] = await res.json();
    setNotes(data);
    return data;
  }, []);

  useEffect(() => {
    fetchNotes().finally(() => setLoading(false));
  }, [fetchNotes]);

  useEffect(() => {
    const interval = setInterval(fetchNotes, 10_000);
    return () => clearInterval(interval);
  }, [fetchNotes]);

  const openNote = useCallback(async (id: string) => {
    setIsNew(false);
    setSelectedId(id);
    const res = await fetch(`/api/notes/${id}`);
    const data: NoteDetail = await res.json();
    setActiveNote(data);
  }, []);

  const handleNew = useCallback(() => {
    setSelectedId(null);
    setActiveNote(null);
    setIsNew(true);
  }, []);

  const handleSave = useCallback(
    async (content: string) => {
      setSaving(true);
      try {
        if (isNew) {
          const res = await fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          });
          const created: NoteDetail = await res.json();
          await fetchNotes();
          setIsNew(false);
          setSelectedId(created.id);
          setActiveNote(created);
        } else if (selectedId) {
          const res = await fetch(`/api/notes/${selectedId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          });
          const updated: NoteDetail = await res.json();
          setActiveNote(updated);
          await fetchNotes();
        }
      } finally {
        setSaving(false);
      }
    },
    [isNew, selectedId, fetchNotes]
  );

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    await fetchNotes();
    if (selectedId === id) {
      setSelectedId(null);
      setActiveNote(null);
      setIsNew(false);
    }
  }, [selectedId, fetchNotes]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#1a1a1a]">
      <div className="flex justify-center items-center py-2.5 border-b border-white/5 shrink-0">
        <div className="flex gap-1 bg-[#242424] rounded-full p-1">
          {(["notes", "tasks"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 rounded-full text-[13px] font-medium transition-all cursor-pointer capitalize ${
                activeTab === tab
                  ? "bg-[#3a3a3a] text-[#e8e8e8]"
                  : "text-[#555] hover:text-[#888]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "notes" ? (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            notes={notes}
            selectedId={selectedId}
            isNewActive={isNew}
            loading={loading}
            onSelect={openNote}
            onNew={handleNew}
            onDelete={handleDelete}
          />
          <Editor
            note={activeNote}
            isNew={isNew}
            saving={saving}
            onSave={handleSave}
          />
        </div>
      ) : (
        <TasksView />
      )}
    </div>
  );
}
