import HighlighterWorker from "@/workers/highlighter/worker?worker";

declare global {
  interface Window {
    highlightWorker?: Worker;
  }
}

console.log("init worker");
const worker = window.highlightWorker ?? new HighlighterWorker();
window.highlightWorker ??= worker;

export default worker;
