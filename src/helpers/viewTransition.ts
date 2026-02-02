import { flushSync } from "react-dom";

export const withReactViewTransition = (fn: () => void) =>
  document.startViewTransition(() => flushSync(fn));
