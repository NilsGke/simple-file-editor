import { useEffect, useRef, useState } from "react";
import Highlighter from "./Highlighter";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";

enum FileState {
  SAVED = "SAVED",
  SAVING = "SAVING",
  ERROR = "ERROR",
  UNSAVED = "UNSAVED",
}

export default function Editor({
  initialFileContents,
  fileName,
  closeFile,
  saveFile,
}: {
  initialFileContents: string;
  fileName: string;
  closeFile: () => void;
  saveFile: (content: string) => Promise<void>;
}) {
  const [fileContents, setFileContents] = useState<string>(initialFileContents);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [fileState, setFileState] = useState<FileState>(FileState.SAVED);

  useEffect(() => {
    // content changed by user -> need to save
    setFileState(FileState.UNSAVED);

    // resize textarea
    if (textareaRef.current === null) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    textareaRef.current.style.width = "auto";
    textareaRef.current.style.width = textareaRef.current.scrollWidth + "px";
  }, [textareaRef, fileContents]);

  const lineCount = fileContents.split(/\r\n|\r|\n/).length;

  return (
    <div className="p-2 size-full">
      <div className="grid grid-rows-[min-content_auto] size-full rounded-md border shadow">
        <div className="flex items-center w-full gap-2 p-2 border-b rounded-t-md">
          <div className="mx-4">{fileName}</div>
          <Button onClick={closeFile} variant="outline">
            Close
          </Button>
          <Button
            onClick={() => {
              setFileState(FileState.SAVING);
              saveFile(fileContents)
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
                <span className="bg-white rounded-full size-2 aspect-square" />
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
          <div
            className="relative overflow-x-auto overflow-y-hidden"
            onClick={(e) => {
              if (textareaRef.current === null) return;
              if (textareaRef.current === document.activeElement) return;
              if (!(e.target as HTMLDivElement).contains(textareaRef.current))
                return;
              textareaRef.current.focus();
              textareaRef.current.setSelectionRange(
                textareaRef.current.value.length,
                textareaRef.current.value.length
              );
            }}
          >
            <Highlighter>{fileContents}</Highlighter>
            <textarea
              ref={textareaRef}
              onChange={(e) => setFileContents(e.target.value)}
              className="relative z-10 w-full h-full p-2 overflow-hidden font-mono text-base text-transparent whitespace-pre bg-transparent outline-none resize-none caret-black"
              value={fileContents}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
