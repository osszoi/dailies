"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

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

function contentToBlocks(content: string): string[] {
  const blocks = content.split(/\n\n+/);
  return blocks.length > 0 ? blocks : [""];
}

function blocksToContent(blocks: string[]): string {
  return blocks.join("\n\n");
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onGlobalKeyDown?: (e: React.KeyboardEvent) => void;
}

export default function MarkdownEditor({ value, onChange, placeholder, autoFocus, onGlobalKeyDown }: Props) {
  const [blocks, setBlocks] = useState<string[]>(() => contentToBlocks(value || ""));
  const [activeBlock, setActiveBlock] = useState<number | null>(autoFocus ? 0 : null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const skipSync = useRef(false);

  useEffect(() => {
    if (skipSync.current) {
      skipSync.current = false;
      return;
    }
    setBlocks(contentToBlocks(value || ""));
  }, [value]);

  useEffect(() => {
    const el = textareaRef.current;
    if (activeBlock === null || !el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
    el.focus();
  }, [activeBlock]);

  const commit = useCallback((newBlocks: string[]) => {
    skipSync.current = true;
    setBlocks(newBlocks);
    onChange(blocksToContent(newBlocks));
  }, [onChange]);

  const handleChange = useCallback((index: number, text: string) => {
    const newBlocks = [...blocks];
    newBlocks[index] = text;
    commit(newBlocks);
    // auto-resize
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [blocks, commit]);

  const handleBlur = useCallback((index: number, text: string) => {
    // if the user typed blank lines inside the block, split it into multiple blocks
    if (text.includes("\n\n")) {
      const subBlocks = text.split(/\n\n+/).filter((_, i, arr) => i < arr.length - 1 || _.trim());
      const newBlocks = [
        ...blocks.slice(0, index),
        ...subBlocks,
        ...blocks.slice(index + 1),
      ];
      commit(newBlocks);
    }
    setActiveBlock(null);
  }, [blocks, commit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      textareaRef.current?.blur();
      return;
    }
    onGlobalKeyDown?.(e);
  }, [onGlobalKeyDown]);

  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setActiveBlock(blocks.length - 1);
    }
  }, [blocks.length]);

  return (
    <div
      className="flex-1 px-8 py-6 cursor-default overflow-y-auto"
      onDoubleClick={handleContainerClick}
    >
      {blocks.map((block, index) => (
        <div key={index} className="mb-4 min-h-6">
          {activeBlock === index ? (
            <textarea
              ref={textareaRef}
              value={block}
              onChange={e => handleChange(index, e.target.value)}
              onBlur={e => handleBlur(index, e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="block w-full bg-[#ffffff08] rounded-md px-2 py-1 outline-none resize-none font-mono text-sm text-[#d4d4d4] leading-7 overflow-hidden"
            />
          ) : (
            <div
              onDoubleClick={() => setActiveBlock(index)}
              className="cursor-default"
            >
              {block.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {block}
                </ReactMarkdown>
              ) : (
                <span className="text-[#3a3a3a] text-sm font-mono select-none">
                  {index === 0 && placeholder ? placeholder : "\u00a0"}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
