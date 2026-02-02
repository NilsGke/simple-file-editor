import { withReactViewTransition } from "@/helpers/viewTransition";
import { useTabStore } from "@/store";
import { useEffect, useState } from "react";
import { useToast } from "./use-toast";

export default function FileTree({
  directoryHandle,
}: {
  directoryHandle: FileSystemDirectoryHandle;
}) {
  return (
    <Directory
      defaultExpanded
      handle={directoryHandle}
      remove={() => alert("cannot remove the root directory")}
    />
  );
}

const Item = ({
  handle,
  remove,
}: {
  handle: FileSystemHandle;
  remove: () => void;
}) =>
  handle.kind === "file" ? (
    <File handle={handle as FileSystemFileHandle} remove={remove} />
  ) : (
    <Directory handle={handle as FileSystemDirectoryHandle} remove={remove} />
  );

function Directory({
  handle,
  defaultExpanded = false,
  remove,
}: {
  handle: FileSystemDirectoryHandle;
  defaultExpanded?: boolean;
  remove: () => void;
}) {
  const { toast } = useToast();

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [files, setFiles] = useState<FileSystemHandle[] | null>(null);

  async function updateFiles() {
    const updatedFiles: FileSystemHandle[] = [];
    const it = handle.entries();
    for await (const [_name, handle] of it) updatedFiles.push(handle);
    setFiles(
      updatedFiles.sort((a, b) =>
        a.kind !== b.kind
          ? a.kind < b.kind
            ? -1
            : 1
          : a.name.localeCompare(b.name),
      ),
    );
  }

  useEffect(() => {
    if (expanded) updateFiles();
  }, [expanded]);

  async function addItem(kind: FileSystemHandle["kind"]) {
    if (!files) throw Error("files not loaded yet!");

    const name = prompt(`Enter ${kind}-name: `);
    if (
      !name ||
      files.some((file) => file.name.toLowerCase() === name.toLowerCase())
    )
      return toast({
        variant: "destructive",
        title: "name is empty or already exists",
      });

    const creationFunctionMap = {
      file: "getFileHandle",
      directory: "getDirectoryHandle",
    } as const satisfies Record<FileSystemHandle["kind"], string>;

    const creationFunctionName = creationFunctionMap[kind];

    await handle[creationFunctionName](name, { create: true });

    updateFiles();
  }

  function removeItem(itemHandle: FileSystemHandle) {
    switch (itemHandle.kind) {
      case "directory":
        if (
          !confirm(
            `you sure you want to remove "${itemHandle.name}" with all its contents?`,
          )
        )
          return;
        break;
      case "file":
        if (!confirm(`you sure you want to remove "${itemHandle.name}"?`))
          return;
        break;
    }

    handle.removeEntry(itemHandle.name, { recursive: true }).then(() => {
      updateFiles();
      toast({
        variant: "default",
        title: itemHandle.name + " deleted",
      });
    });
  }

  return (
    <div>
      <details
        open={expanded}
        onToggle={(e) => {
          e.stopPropagation();
          setExpanded((e.target as HTMLDetailsElement).open);
        }}
      >
        <summary className="cursor-pointer space-x-4 *:inline-block">
          <div>{handle.name}</div>

          <button title="add directory" onClick={() => addItem("directory")}>
            +d
          </button>

          <button title="add file" onClick={() => addItem("file")}>
            +f
          </button>

          <button title="add file" onClick={() => remove()}>
            -d
          </button>
        </summary>

        <div className="ml-3 pl-3 border-l- 2 border-l-white/20">
          {files?.map((file) => (
            <Item
              key={file.name}
              handle={file}
              remove={() => removeItem(file)}
            />
          ))}
        </div>
      </details>
    </div>
  );
}

function File({
  handle,
  remove,
}: {
  handle: FileSystemFileHandle;
  remove: () => void;
}) {
  const openTab = useTabStore((s) => s.openTab);
  return (
    <div className="flex gap-4">
      <button
        className="block"
        onClick={async () => {
          const content = await handle.getFile().then((file) => file.text());

          withReactViewTransition(() =>
            openTab({ handle, id: Date.now(), content, dirty: false }),
          );
        }}
      >
        {handle.name}
      </button>
      <button onClick={remove}>-f</button>
    </div>
  );
}
