import { withReactViewTransition } from "@/helpers/viewTransition";
import { useTabStore } from "@/store";
import { useEffect, useState } from "react";

export default function FileTree({
  directoryHandle,
}: {
  directoryHandle: FileSystemDirectoryHandle;
}) {
  return <Directory defaultExpanded handle={directoryHandle} />;
}

const Item = ({ handle }: { handle: FileSystemHandle }) =>
  handle.kind === "file" ? (
    <File handle={handle as FileSystemFileHandle} />
  ) : (
    <Directory handle={handle as FileSystemDirectoryHandle} />
  );

function Directory({
  handle,
  defaultExpanded = false,
}: {
  handle: FileSystemDirectoryHandle;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [files, setFiles] = useState<FileSystemHandle[] | null>(null);

  useEffect(() => {
    (async () => {
      if (!expanded) return;
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
    })();
  }, [expanded]);

  return (
    <div>
      <details
        open={expanded}
        onToggle={(e) => {
          e.stopPropagation();
          setExpanded((e.target as HTMLDetailsElement).open);
        }}
      >
        <summary className="cursor-pointer">{handle.name}</summary>

        <div className="ml-3 pl-3 border-l-2 border-l-white/20">
          {files?.map((file) => (
            <Item key={file.name} handle={file} />
          ))}
        </div>
      </details>
    </div>
  );
}

function File({ handle }: { handle: FileSystemFileHandle }) {
  const openTab = useTabStore((s) => s.openTab);
  return (
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
  );
}
