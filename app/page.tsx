"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Editor from "@/components/Editor";
import { NoteListItem, NoteDetail } from "@/lib/types";

export default function Home() {
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
    <div className="flex h-screen overflow-hidden bg-[#1a1a1a]">
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
  );
}
