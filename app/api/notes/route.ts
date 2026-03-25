import { NextResponse } from "next/server";
import { listNotes, createNote } from "@/lib/notes";

export async function GET() {
  const notes = listNotes();
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const { content } = await req.json();
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }
  const note = createNote(content.trim());
  return NextResponse.json(note, { status: 201 });
}
