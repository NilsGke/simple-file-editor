import { useEffect, useState } from "react";
import "highlight.js/styles/github.css";
import HighlighterWorker from "@/workers/highlighter/highlighter?worker";
import {
  handleMessageFromWorker,
  sendMessageToWorker,
} from "@/workers/highlighter/communication";
import escapeHTML from "@/helpers/escapeHTML";

export default function Highlighter({ children }: { children: string }) {
  const [highlightedHTML, setHighlightedHTML] = useState(escapeHTML(children));

  // mout web worker
  useEffect(() => {
    const worker = new HighlighterWorker();
    setWorker(worker);
    worker.onmessage = (event) =>
      handleMessageFromWorker(event, ({ type, data }) => {
        if (type === "highlightResult") setHighlightedHTML(data);
      });

    return () => worker.terminate();
  }, []);

  // send highlight message
  useEffect(() => {
    if (worker === null) return;
    sendMessageToWorker(worker, "pleaseHighlight", children);
  }, [children, worker]);

  return (
    <div
      className="relative z-0 p-2 font-mono text-base whitespace-pre"
      dangerouslySetInnerHTML={{ __html: highlightedHTML }}
    ></div>
  );
}
