import hljs from "highlight.js";
import { useEffect, useState } from "react";
import "highlight.js/styles/github.css";

export default function Highlighter({ children }: { children: string }) {
  const [highlightedHTML, setHighlightedHTML] = useState("");

  // highlight
  useEffect(() => {
    const { value } = hljs.highlightAuto(children);
    setHighlightedHTML(value);
  }, [children]);

  return (
    <div
      className="absolute z-0 p-2 font-mono text-base whitespace-pre"
      dangerouslySetInnerHTML={{ __html: highlightedHTML }}
    ></div>
  );
}
