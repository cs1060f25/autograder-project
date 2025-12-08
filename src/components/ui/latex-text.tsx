"use client";

import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

interface LaTeXTextProps {
  content: string;
  className?: string;
  blockClassName?: string;
}

/**
 * Component that renders text with LaTeX equations.
 * Supports both inline math ($...$) and block math ($$...$$) syntax.
 */
export function LaTeXText({
  content,
  className = "",
  blockClassName = "",
}: LaTeXTextProps) {
  // Handle null/undefined content
  if (!content) {
    return <span className={className}></span>;
  }

  // Split content by LaTeX delimiters
  // Matches: $$...$$ (block math) and $...$ (inline math)
  const parts: Array<{ type: "text" | "block" | "inline"; content: string }> =
    [];
  let lastIndex = 0;
  let inBlock = false;
  let inInline = false;
  let blockStart = -1;
  let inlineStart = -1;

  for (let i = 0; i < content.length; i++) {
    // Check for block math delimiter $$
    if (
      i < content.length - 1 &&
      content[i] === "$" &&
      content[i + 1] === "$"
    ) {
      if (inBlock) {
        // End of block math
        const mathContent = content.slice(blockStart + 2, i);
        if (mathContent.trim()) {
          parts.push({ type: "block", content: mathContent });
        }
        inBlock = false;
        blockStart = -1;
        lastIndex = i + 2;
        i++; // Skip second $
        continue;
      } else if (!inInline) {
        // Start of block math
        if (i > lastIndex) {
          const textContent = content.slice(lastIndex, i);
          if (textContent) {
            parts.push({ type: "text", content: textContent });
          }
        }
        inBlock = true;
        blockStart = i;
        i++; // Skip second $
        continue;
      }
    }

    // Check for inline math delimiter $ (only if not in block)
    if (!inBlock && content[i] === "$") {
      if (inInline) {
        // End of inline math
        const mathContent = content.slice(inlineStart + 1, i);
        if (mathContent.trim()) {
          parts.push({ type: "inline", content: mathContent });
        }
        inInline = false;
        inlineStart = -1;
        lastIndex = i + 1;
        continue;
      } else {
        // Start of inline math (check it's not block math)
        if (i === content.length - 1 || content[i + 1] !== "$") {
          if (i > lastIndex) {
            const textContent = content.slice(lastIndex, i);
            if (textContent) {
              parts.push({ type: "text", content: textContent });
            }
          }
          inInline = true;
          inlineStart = i;
          continue;
        }
      }
    }
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    if (remainingText) {
      parts.push({ type: "text", content: remainingText });
    }
  }

  // If no LaTeX found, just return the text
  if (parts.length === 0 || (parts.length === 1 && parts[0].type === "text")) {
    return (
      <span className={`${className} whitespace-pre-wrap`}>{content}</span>
    );
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === "text") {
          return (
            <span key={index} className="whitespace-pre-wrap">
              {part.content}
            </span>
          );
        } else if (part.type === "block") {
          return (
            <div key={index} className={`my-2 ${blockClassName}`}>
              <BlockMath math={part.content} />
            </div>
          );
        } else {
          return <InlineMath key={index} math={part.content} />;
        }
      })}
    </span>
  );
}
