import { NextResponse } from "next/server";
import { listAllTasks } from "@/lib/notes";

export async function GET() {
  const tasks = listAllTasks();
  return NextResponse.json(tasks);
}
