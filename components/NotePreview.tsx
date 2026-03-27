"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { NoteDetail, Task } from "@/lib/types";

const mdComponents: Components = {
  h1: ({ children }) => <h1 className="text-2xl font-bold text-white mt-1 mb-0.5">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold text-[#e8e8e8] mt-1 mb-0.5">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold text-[#ccc] mb-0.5">{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-semibold text-[#bbb]">{children}</h4>,
  p: ({ children }) => <p className="text-[#d4d4d4] leading-7">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 text-[#d4d4d4] leading-7 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 text-[#d4d4d4] leading-7 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-7">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-[#d4d4d4]">{children}</em>,
  code: ({ children }) => (
    <code className="bg-[#2a2a2a] text-[#e06c75] font-mono text-xs px-1.5 py-0.5 rounded">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs p-3 rounded-md overflow-x-auto my-1">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[#444] pl-3 text-[#888] italic">{children}</blockquote>
  ),
  hr: () => <hr className="border-[#333] my-2" />,
  a: ({ children, href }) => (
    <a href={href} className="text-[#4a9eff] underline underline-offset-2">{children}</a>
  ),
};

function formatTimestamp(id: string): string {
  try {
    const iso = id.replace(
      /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})$/,
      "$1T$2:$3:$4"
    );
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return id;
  }
}

// Strip common markdown syntax to get comparable plain text
function toPlainText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .trim();
}

interface Props {
  note: NoteDetail;
  task: Task;
}

export default function NotePreview({ note, task }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastHighlight = useRef<HTMLElement | null>(null);

  const lines = note.content.split("\n");
  const firstLine = lines[0] ?? "";
  let title: string | null = null;
  let body: string;

  if (firstLine.startsWith("title: ")) {
    title = firstLine.slice(7).trim();
    body = lines.slice(1).join("\n");
  } else {
    body = note.content;
  }

  useEffect(() => {
    if (lastHighlight.current) {
      const el = lastHighlight.current;
      el.style.backgroundColor = "";
      el.style.borderLeft = "";
      el.style.paddingLeft = "";
      el.style.marginLeft = "";
      el.style.borderRadius = "";
      lastHighlight.current = null;
    }

    if (!containerRef.current) return;

    const target = toPlainText(task.text);

    const timeout = setTimeout(() => {
      if (!containerRef.current) return;

      const items = containerRef.current.querySelectorAll("li");
      for (const item of items) {
        if (!item.querySelector('input[type="checkbox"]')) continue;
        const itemText = (item.textContent ?? "").trim();
        if (itemText === target || itemText.includes(target)) {
          item.scrollIntoView({ behavior: "smooth", block: "center" });
          item.style.backgroundColor = "rgba(74, 158, 255, 0.1)";
          item.style.borderLeft = "2px solid rgba(74, 158, 255, 0.5)";
          item.style.paddingLeft = "8px";
          item.style.marginLeft = "-10px";
          item.style.borderRadius = "3px";
          lastHighlight.current = item as HTMLElement;
          break;
        }
      }
    }, 80);

    return () => clearTimeout(timeout);
  }, [task.id, task.text, body]);

  return (
    <div className="flex flex-col h-full overflow-hidden border-l border-white/5">
      <div className="px-6 py-4 border-b border-white/5 shrink-0">
        <p className="text-[10px] text-[#555] font-mono">{formatTimestamp(note.id)}</p>
        {title && <h2 className="text-lg font-bold text-[#e8e8e8] mt-1 leading-snug">{title}</h2>}
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {body}
        </ReactMarkdown>
      </div>
    </div>
  );
}
