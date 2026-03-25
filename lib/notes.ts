import fs from "fs";
import path from "path";
import { NoteListItem, NoteDetail } from "./types";

export type { NoteType, NoteListItem, NoteDetail } from "./types";

const NOTES_DIR = path.join(process.cwd(), "notes");
const RAW_DIR = path.join(NOTES_DIR, "raw");
const PROCESSED_DIR = path.join(NOTES_DIR, "processed");

function ensureDirs() {
  [RAW_DIR, PROCESSED_DIR].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

function parseId(filename: string) {
  return filename.replace(/\.md$/, "");
}

function parseProcessed(content: string): { title: string; body: string } {
  const lines = content.split("\n");
  const firstLine = lines[0] ?? "";
  if (firstLine.startsWith("title: ")) {
    return {
      title: firstLine.slice(7).trim(),
      body: lines.slice(1).join("\n").trim(),
    };
  }
  return { title: firstLine.trim(), body: lines.slice(1).join("\n").trim() };
}

export function listNotes(): NoteListItem[] {
  ensureDirs();

  const rawFiles = fs.existsSync(RAW_DIR)
    ? fs.readdirSync(RAW_DIR).filter((f) => f.endsWith(".md"))
    : [];
  const processedFiles = fs.existsSync(PROCESSED_DIR)
    ? fs.readdirSync(PROCESSED_DIR).filter((f) => f.endsWith(".md"))
    : [];

  const processedSet = new Set(processedFiles.map(parseId));

  const notes: NoteListItem[] = [];

  for (const file of processedFiles) {
    const id = parseId(file);
    const content = fs.readFileSync(path.join(PROCESSED_DIR, file), "utf-8");
    const { title, body } = parseProcessed(content);
    notes.push({ id, type: "processed", title, preview: body, timestamp: id });
  }

  for (const file of rawFiles) {
    const id = parseId(file);
    if (processedSet.has(id)) continue;
    const content = fs.readFileSync(path.join(RAW_DIR, file), "utf-8").trim();
    notes.push({ id, type: "raw", title: null, preview: content, timestamp: id });
  }

  notes.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return notes;
}

export function getNote(id: string): NoteDetail | null {
  ensureDirs();

  const processedPath = path.join(PROCESSED_DIR, `${id}.md`);
  if (fs.existsSync(processedPath)) {
    return {
      id,
      type: "processed",
      content: fs.readFileSync(processedPath, "utf-8"),
      timestamp: id,
    };
  }

  const rawPath = path.join(RAW_DIR, `${id}.md`);
  if (fs.existsSync(rawPath)) {
    return {
      id,
      type: "raw",
      content: fs.readFileSync(rawPath, "utf-8"),
      timestamp: id,
    };
  }

  return null;
}

export function createNote(content: string): NoteDetail {
  ensureDirs();
  const now = new Date();
  const id = now
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\..+$/, "");
  const filePath = path.join(RAW_DIR, `${id}.md`);
  fs.writeFileSync(filePath, content, "utf-8");
  return { id, type: "raw", content, timestamp: id };
}

export function deleteNote(id: string): boolean {
  ensureDirs();
  let deleted = false;
  const processedPath = path.join(PROCESSED_DIR, `${id}.md`);
  if (fs.existsSync(processedPath)) { fs.unlinkSync(processedPath); deleted = true; }
  const rawPath = path.join(RAW_DIR, `${id}.md`);
  if (fs.existsSync(rawPath)) { fs.unlinkSync(rawPath); deleted = true; }
  return deleted;
}

export function updateNote(id: string, content: string): NoteDetail | null {
  ensureDirs();

  const processedPath = path.join(PROCESSED_DIR, `${id}.md`);
  if (fs.existsSync(processedPath)) {
    fs.writeFileSync(processedPath, content, "utf-8");
    return { id, type: "processed", content, timestamp: id };
  }

  const rawPath = path.join(RAW_DIR, `${id}.md`);
  if (fs.existsSync(rawPath)) {
    fs.writeFileSync(rawPath, content, "utf-8");
    return { id, type: "raw", content, timestamp: id };
  }

  return null;
}
