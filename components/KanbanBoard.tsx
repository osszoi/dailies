"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/lib/types";

function CardFace({ task, selected, done }: { task: Task; selected: boolean; done: boolean }) {
  return (
    <div
      className={`rounded-lg p-3 border transition-colors ${
        selected
          ? "bg-[#252525] border-[#4a9eff]/40"
          : "bg-[#242424] border-white/5"
      } ${done ? "opacity-50" : ""}`}
    >
      <p className={`text-sm leading-snug mb-2.5 ${done ? "line-through text-[#666]" : "text-[#d4d4d4]"}`}>
        {task.text}
      </p>
      <p className="text-[10px] text-[#555] truncate">
        {task.noteTitle ?? task.noteId}
      </p>
    </div>
  );
}

function KanbanCard({ task, selected, done, onViewSource }: {
  task: Task;
  selected: boolean;
  done: boolean;
  onViewSource: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group mb-2 cursor-grab active:cursor-grabbing ${isDragging ? "opacity-25" : ""}`}
      {...listeners}
      {...attributes}
    >
      <CardFace task={task} selected={selected} done={done} />
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onViewSource(task); }}
        className="absolute bottom-3 right-3 text-[10px] text-[#555] hover:text-[#4a9eff] cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
      >
        view source →
      </button>
    </div>
  );
}

function PendingColumn({ tasks, selectedTaskId, onViewSource }: {
  tasks: Task[];
  selectedTaskId: string | null;
  onViewSource: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "pending" });

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-[11px] font-semibold text-[#666] uppercase tracking-wider">Pending</span>
        <span className="text-[10px] text-[#444] bg-[#2a2a2a] px-1.5 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 min-h-20 transition-colors ${
          isOver ? "bg-[#4a9eff]/5 ring-1 ring-[#4a9eff]/20" : "bg-[#1d1d1d]"
        }`}
      >
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            selected={task.id === selectedTaskId}
            done={false}
            onViewSource={onViewSource}
          />
        ))}
        {tasks.length === 0 && (
          <p className="text-[11px] text-[#3a3a3a] text-center py-8">No pending tasks</p>
        )}
      </div>
    </div>
  );
}

function DoneColumn({ tasks, selectedTaskId, onViewSource }: {
  tasks: Task[];
  selectedTaskId: string | null;
  onViewSource: (task: Task) => void;
}) {
  const [open, setOpen] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: "done" });

  return (
    <div ref={setNodeRef} className={`flex flex-col flex-1 min-w-0 rounded-xl transition-all ${isOver ? "ring-1 ring-[#4a9eff]/20" : ""}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 mb-3 px-1 cursor-pointer hover:opacity-80 transition-opacity w-full"
      >
        <span className="text-[11px] font-semibold text-[#666] uppercase tracking-wider">Done</span>
        <span className="text-[10px] text-[#444] bg-[#2a2a2a] px-1.5 py-0.5 rounded-full">{tasks.length}</span>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`text-[#444] transition-transform ml-auto ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className={`rounded-xl p-2 min-h-20 transition-colors ${isOver ? "bg-[#4a9eff]/5" : "bg-[#1d1d1d]"}`}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              selected={task.id === selectedTaskId}
              done={true}
              onViewSource={onViewSource}
            />
          ))}
          {tasks.length === 0 && (
            <p className="text-[11px] text-[#3a3a3a] text-center py-8">Nothing done yet</p>
          )}
        </div>
      ) : (
        <div className={`rounded-xl min-h-16 flex items-center justify-center transition-colors ${isOver ? "bg-[#4a9eff]/5" : "bg-[#1d1d1d]"}`}>
          <p className="text-[10px] text-[#3a3a3a]">
            {isOver ? "release to mark done ✓" : "drag here to complete · click to expand"}
          </p>
        </div>
      )}
    </div>
  );
}

interface Props {
  pendingTasks: Task[];
  doneTasks: Task[];
  selectedTaskId: string | null;
  onViewSource: (task: Task) => void;
  onToggle: (task: Task, checked: boolean) => void;
}

export default function KanbanBoard({ pendingTasks, doneTasks, selectedTaskId, onViewSource, onToggle }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const allTasks = [...pendingTasks, ...doneTasks];
  const activeTask = allTasks.find((t) => t.id === activeId) ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const task = allTasks.find((t) => t.id === active.id);
    if (!task) return;

    const col = over.id as string;
    if (col === "done" && !task.checked) onToggle(task, true);
    else if (col === "pending" && task.checked) onToggle(task, false);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 items-start">
        <PendingColumn tasks={pendingTasks} selectedTaskId={selectedTaskId} onViewSource={onViewSource} />
        <DoneColumn tasks={doneTasks} selectedTaskId={selectedTaskId} onViewSource={onViewSource} />
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask && <CardFace task={activeTask} selected={false} done={activeTask.checked} />}
      </DragOverlay>
    </DndContext>
  );
}
