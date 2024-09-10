import hljs from "highlight.js";
import { handleMessageFromClient, sendMessageToClient } from "./communication";

onmessage = (event) =>
  handleMessageFromClient(event, ({ type, data }) => {
    switch (type) {
      case "highlightTask": {
        const result = hljs.highlightAuto(data.content);

        sendMessageToClient("highlightResult", {
          result: { value: result.value, language: result.language },
          timestamp: data.timestamp,
        });

        break;
      }

      case "ping": {
        sendMessageToClient("pong", undefined);
        break;
      }

      default:
        console.warn("no worker handle code found for message: ", type);
        break;
    }
  });
