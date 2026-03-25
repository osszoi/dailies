export type NoteType = "raw" | "processed";

export interface NoteListItem {
  id: string;
  type: NoteType;
  title: string | null;
  preview: string;
  timestamp: string;
}

export interface NoteDetail {
  id: string;
  type: NoteType;
  content: string;
  timestamp: string;
}
