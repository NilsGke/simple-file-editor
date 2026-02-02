import { useEffect, useState } from "react";
import "highlight.js/styles/github-dark.css";
import {
  handleMessageFromWorker,
  sendMessageToWorker,
} from "@/workers/highlighter/communication";
import escapeHTML from "@/helpers/escapeHTML";
import worker from "@/workers/highlighter/init";

export default function HighlightedEditor({
  content,
  onChange,
  updateHighlightInfo,
}: {
  content: string;
  onChange: (newContent: string) => void;
  updateHighlightInfo: (info: {
    usedLanguage: string | null;
    highlightTime: number;
  }) => void;
}) {
  const [highlightedHTML, setHighlightedHTML] = useState(escapeHTML(content));
  const [_highlightTime, setHighlightTime] = useState<number | null>(null);
  const [lastUpdateTimestmap, setLastUpdateTimestmap] = useState<number | null>(
    null,
  );

  // send highlight message
  useEffect(() => {
    const timestamp = Date.now();
    sendMessageToWorker(worker, "highlightTask", { content, timestamp });
    setLastUpdateTimestmap(timestamp);
  }, [content]);

  // receive highlighted code
  useEffect(() => {
    worker.onmessage = (event) =>
      handleMessageFromWorker(event, ({ type, data }) => {
        if (type === "highlightResult") {
          if (lastUpdateTimestmap !== data.timestamp) return;
          const highlightTime = data.timestamp - Date.now();
          setHighlightTime(highlightTime);
          setHighlightedHTML(data.result.value);
          updateHighlightInfo({
            highlightTime,
            usedLanguage: data.result.language ?? null,
          });
        }
      });
  }, [lastUpdateTimestmap, updateHighlightInfo]);

  return (
    <div className="p-2 size-full">
      <textarea
        className="bg-transparent text-transparent outline-none caret-white size-full font-mono text-base whitespace-pre"
        onChange={(e) => onChange((e.target as HTMLTextAreaElement).value)}
        value={content}
      />

      <div
        className="absolute pointer-events-none top-0 left-0 p-2 z-0 font-mono text-base whitespace-pre"
        dangerouslySetInnerHTML={{ __html: highlightedHTML }}
      />
    </div>
  );
}
