import { useEffect, useState } from "react";
import "highlight.js/styles/github-dark.css";
import worker, {
  handleMessageFromWorker,
  sendMessageToWorker,
} from "@/workers/highlighter/communication";
import escapeHTML from "@/helpers/escapeHTML";
// TODO: use the div as the edit area and use contenteditable together with mutation observer to provide the edit functionality
// https://stackoverflow.com/a/14043919/10429375
// then have some system in place to check if a change happend while highlighting was in progress
// then only apply highlighting if no changes happend inbetween
// this way the user does not notice that their text that tey are editing is replaced with highlighted text
// benifit: no delay between user input and text appearing

export default function Highlighter({ children }: { children: string }) {
  const [highlightedHTML, setHighlightedHTML] = useState(escapeHTML(children));

  // mout web worker
  useEffect(() => {
    worker.onmessage = (event) =>
      handleMessageFromWorker(event, ({ type, data }) => {
        if (type === "highlightResult") setHighlightedHTML(data);
      });
  }, []);

  // send highlight message
  useEffect(() => {
    if (worker === null) return;
    sendMessageToWorker(worker, "pleaseHighlight", children);
  }, [children]);

  return (
    <div
      className="relative z-0 p-2 font-mono text-base whitespace-pre"
      dangerouslySetInnerHTML={{ __html: highlightedHTML }}
    ></div>
  );
}
