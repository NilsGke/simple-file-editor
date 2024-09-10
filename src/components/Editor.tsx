import { useEffect, useState } from "react";
import Highlighter from "./Highlighter";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { ToastAction } from "./ui/toast";
import RelativeTime from "./RelativeTime";

enum FileState {
  SAVED = "SAVED",
  SAVING = "SAVING",
  ERROR = "ERROR",
  UNSAVED = "UNSAVED",
}

export default function Editor({
  fileKey,
  fileName,
  fileHandle,
  lastOpened,
  closeFile,
}: {
  fileKey: IDBValidKey;
  fileName: string;
  fileHandle: FileSystemFileHandle | null;
  lastOpened?: number;
  closeFile: () => void;
}) {
  const [fileContents, setFileContents] = useState<string | null>(null);
  const [fileState, setFileState] = useState<FileState>(FileState.SAVED);

  // const [selectedLanguage, setSelectedLanguage] = useState<
  //   string | "autodetect" | null
  // >(null);
  const [highlightInfo, setHighlightInfo] = useState<{
    usedLanguage: string | null;
    highlightTime: number;
  } | null>(null);

  const { dismiss, toast } = useToast();

  // load initial file contents
  useEffect(() => {
    if (fileHandle === null || fileContents !== null) return;

    fileHandle
      .getFile()
      .then((file) => file.text())
      .then((content) => setFileContents(content));
  }, [fileContents, fileHandle]);

  // update save state on content change
  useEffect(() => {
    setFileState(FileState.UNSAVED);
  }, [fileContents]);

  // TODO: update lastSaved
  const saveFile = async () => {
    dismiss();
    // handle file not loaded state
    if (fileHandle === null || fileContents === null)
      return toast({
        title: "File not loaded yet",
        action: (
          <ToastAction altText="try again" onClick={saveFile}>
            try again
          </ToastAction>
        ),
        variant: "destructive",
      });

    const writable = await fileHandle
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

  return (
    <div className="p-2 size-full">
      <div
        className="grid grid-rows-[min-content_auto] size-full rounded-md border shadow"
        style={{ viewTransitionName: `container-${String(fileKey)}` }}
      >
        <div className="flex items-center w-full gap-2 p-2 border-b rounded-t-md">
          <div className="grid grid-rows-2">
            <div
              className="mx-4"
              style={{ viewTransitionName: `filename-${String(fileKey)}` }}
            >
              {fileName}
            </div>
            <div
              className="text-xs text-zinc-400 dark:text-zinc-600"
              style={{ viewTransitionName: `lastOpened-${String(fileKey)}` }}
            >
              {lastOpened && <RelativeTime time={lastOpened} />}
            </div>
          </div>
          <Button onClick={closeFile} variant="outline">
            Close
          </Button>
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

          <div>
            highlighted: {highlightInfo?.usedLanguage} in{" "}
            {highlightInfo && Math.abs(highlightInfo.highlightTime)}ms
          </div>
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
              <Highlighter
                content={fileContents}
                onChange={setFileContents}
                updateHighlightInfo={setHighlightInfo}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
