import { AutoHighlightResult } from "highlight.js";

type WorkerMessageMap = {
  highlightResult: {
    result: Pick<AutoHighlightResult, "value" | "language">;
    timestamp: number;
  };
  pong: void;
};
type ClientMessageMap = {
  highlightTask: { timestamp: number; content: string };
  ping: void;
};

type WorkerMessage<K extends keyof WorkerMessageMap> = {
  type: K;
  data: WorkerMessageMap[K];
};

type ClientMessage<K extends keyof ClientMessageMap> = {
  type: K;
  data: ClientMessageMap[K];
};

export const handleMessageFromClient = <T extends keyof ClientMessageMap>(
  { data }: MessageEvent<ClientMessage<T>>,
  callback: (
    message: {
      [K in T]: { type: K; data: ClientMessageMap[K] };
    }[T]
  ) => void
) => callback(data);

export const handleMessageFromWorker = <T extends keyof WorkerMessageMap>(
  { data }: MessageEvent<WorkerMessage<T>>,
  callback: (
    message: { [K in T]: { type: K; data: WorkerMessageMap[K] } }[T]
  ) => void
) => callback(data);

export const sendMessageToWorker = <T extends keyof ClientMessageMap>(
  worker: Worker,
  type: T,
  data: ClientMessageMap[T]
) => worker.postMessage({ type, data });

export const sendMessageToClient = <T extends keyof WorkerMessageMap>(
  type: T,
  data: WorkerMessageMap[T]
) => postMessage({ type, data });
