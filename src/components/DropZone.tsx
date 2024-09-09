import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useToast } from "./ui/use-toast";

export default function DropZone({
  processFileHandle,
}: {
  processFileHandle: (fileHandle: FileSystemFileHandle) => void;
}) {
  const { toast } = useToast();
  const [dragging, setDragging] = useState(false);

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    if (e.target === null || e.dataTransfer === null) {
      toast({
        title: "received no data from drop",
        variant: "destructive",
      });
      return;
    }

    const item = Array.from(e.dataTransfer.items).at(0);
    if (item === undefined) {
      toast({
        title: "Did not get any Items from data transfer",
        variant: "destructive",
      });
      return;
    }

    if (item.kind !== "file") {
      toast({
        title: "Not a file!",
        variant: "destructive",
      });
      return;
    }

    const fileHandle = await item.getAsFileSystemHandle();
    if (fileHandle === null) {
      toast({
        title: "Could not get fileHandle",
        variant: "destructive",
      });
      return;
    }

    if (fileHandle.kind === "directory") {
      toast({
        title: "Cannot open directories",
        description: "Only files supported.",
        variant: "destructive",
      });
      return;
    }

    if (fileHandle.kind === "file")
      processFileHandle(fileHandle as FileSystemFileHandle);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={twMerge(
        "flex items-center justify-center col-span-2 transition border border-dashed rounded-lg text-zinc-400",
        dragging && "border-solid text-zinc-300 bg-zinc-100"
      )}
    >
      Drop File
    </div>
  );
}
