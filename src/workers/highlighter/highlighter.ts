import hljs from "highlight.js";
import { handleMessageFromClient, sendMessageToClient } from "./communication";

onmessage = (event) =>
  handleMessageFromClient(event, ({ type, data }) => {
    switch (type) {
      case "pleaseHighlight": {
        const highlighted = hljs.highlightAuto(data);
        sendMessageToClient("highlightResult", highlighted.value);
        break;
      }
      default:
        console.warn("no worker handle code found for message: ", type);
        break;
    }
  });
