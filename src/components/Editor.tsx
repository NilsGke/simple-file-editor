import { useState } from "react";
import HighlightedEditor from "./HighlightedEditor";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { ToastAction } from "./ui/toast";
import { useTabStore } from "@/store";

enum FileState {
  SAVED = "SAVED",
  SAVING = "SAVING",
  ERROR = "ERROR",
  UNSAVED = "UNSAVED",
}

export default function Editor() {
  const { tabs, activeTab, updateContent } = useTabStore();
  const tab = tabs.find((tab) => tab.id === activeTab);
  const activeHandle = tab?.handle || null;
  const fileContents = !tab ? null : tab.content;

  const [fileState, setFileState] = useState<FileState>(FileState.SAVED);

  // const [selectedLanguage, setSelectedLanguage] = useState<
  //   string | "autodetect" | null
  // >(null);
  const [highlightInfo, setHighlightInfo] = useState<{
    usedLanguage: string | null;
    highlightTime: number;
  } | null>(null);

  const { dismiss, toast } = useToast();

  const saveFile = async () => {
    dismiss();
    // handle file not loaded state
    if (activeHandle === null || fileContents === null)
      return toast({
        title: "File not loaded yet",
        action: (
          <ToastAction altText="try again" onClick={saveFile}>
            try again
          </ToastAction>
        ),
        variant: "destructive",
      });

    const writable = await activeHandle
      .createWritable({
        keepExistingData: false,
      })
      .catch((reason) => {
        console.error(reason);
        throw "could not create writable";
      });

    toast({
      title: "Saving file...",
      action: (
        <ToastAction
          altText="cancel saving file"
          onClick={() => {
            writable.abort();
            writable.close();
          }}
        >
          cancel
        </ToastAction>
      ),
    });

    await writable.write(fileContents).catch((reason) => {
      console.error(reason);
      throw "could not write to file";
    });

    await writable.close().catch((reason) => {
      console.error(reason);
      throw `Error: ${reason}`;
    });
  };

  const lineCount = fileContents?.split(/\r\n|\r|\n/).length || 0;

  if (activeHandle === null) return <div>No file selected</div>;

  return (
    <div className="grid grid-rows-[min-content_auto] overflow-hidden max-h-full size-full border shadow">
      <div className="flex items-center justify-between w-full gap-2 p-2 border-b rounded-t-md">
        <div className="text-sm">
          <span className="text-zinc-400">{highlightInfo?.usedLanguage}</span>{" "}
          <span className="text-zinc-600">
            ({highlightInfo && Math.abs(highlightInfo.highlightTime)} ms)
          </span>
        </div>
        <Button
          onClick={() => {
            setFileState(FileState.SAVING);
            saveFile()
              .then(() => {
                setFileState(FileState.SAVED);
                toast({
                  description: "File saved!",
                  variant: "success",
                });
              })
              .catch(() => setFileState(FileState.ERROR));
          }}
          disabled={fileState === FileState.SAVING}
        >
          {fileState === FileState.UNSAVED ? (
            <div className="flex items-center justify-center gap-2">
              Save{" "}
              <span className="bg-white rounded-full dark:bg-black size-2 aspect-square" />
            </div>
          ) : fileState === FileState.SAVED ? (
            "Saved"
          ) : fileState === FileState.SAVING ? (
            "Saving"
          ) : (
            "Error"
          )}
        </Button>
      </div>
      <div className="grid grid-cols-[min-content_auto] overflow-y-scroll">
        {/* line numbers */}
        <div className="px-1 pt-2 font-mono text-base text-right whitespace-pre border-r text-zinc-400">
          {lineCount &&
            Array.from(Array(lineCount))
              .map((_, index) => index + 1)
              .join("\n")}
        </div>

        {/* actual editor */}
        <div className="relative overflow-x-auto overflow-y-hidden">
          {fileContents === null && (
            <div className="text-center">Loading file...</div>
          )}
          {fileContents !== null && (
            <HighlightedEditor
              content={fileContents}
              onChange={(content) => tab && updateContent(tab.id, content)}
              updateHighlightInfo={setHighlightInfo}
            />
          )}
        </div>
      </div>
    </div>
  );
}
