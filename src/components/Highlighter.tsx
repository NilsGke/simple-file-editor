import { useEffect, useState } from "react";
import "highlight.js/styles/github-dark.css";
import {
  handleMessageFromWorker,
  sendMessageToWorker,
} from "@/workers/highlighter/communication";
import escapeHTML from "@/helpers/escapeHTML";
import worker from "@/workers/highlighter/init";
// TODO: use the div as the edit area and use contenteditable together with mutation observer to provide the edit functionality
// https://stackoverflow.com/a/14043919/10429375
// then have some system in place to check if a change happend while highlighting was in progress
// then only apply highlighting if no changes happend inbetween
// this way the user does not notice that their text that tey are editing is replaced with highlighted text
// benifit: no delay between user input and text appearing

export default function Highlighter({
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
    null
  );

  // TODO implement highlight debounce using `highlightTime`

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
    <div
      className="relative z-0 p-2 font-mono text-base whitespace-pre"
      dangerouslySetInnerHTML={{ __html: highlightedHTML }}
      contentEditable="plaintext-only"
      onInput={(e) => {
        onChange((e.target as HTMLDivElement).innerText);
      }}
    />
  );
}
