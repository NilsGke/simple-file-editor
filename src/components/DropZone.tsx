import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useToast } from "./ui/use-toast";

export default function DropZone({
  processDirectoryHandle,
}: {
  processDirectoryHandle: (fileHandle: FileSystemDirectoryHandle) => void;
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

    // directory still counts as kind "file"
    if (item.kind !== "file") {
      toast({
        title: "Not a Directory!",
        variant: "destructive",
      });
      return;
    }

    const fileSystemHandle = await item.getAsFileSystemHandle();
    if (fileSystemHandle === null) {
      toast({
        title: "Could not get fileSystemHandle",
        variant: "destructive",
      });
      return;
    }

    if (fileSystemHandle.kind === "file") {
      toast({
        title: "Please open a directory",
        description: "Dont open files directly",
        variant: "destructive",
      });
      return;
    }

    if (fileSystemHandle.kind === "directory")
      processDirectoryHandle(fileSystemHandle as FileSystemDirectoryHandle);
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
        dragging && "border-solid text-zinc-300 bg-zinc-100",
      )}
    >
      Drop Directory
    </div>
  );
}
