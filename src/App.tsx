import { useEffect, useState } from "react";
import FileChooser from "./components/FileChooser";
import Editor from "./components/Editor";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/ui/card";
import RecentFiles from "./components/RecentFiles";
import { LocalFileWithKey } from "./db/db";
import useIDBQuery from "./db/lib/hooks/useIDBQuery";
import { flushSync } from "react-dom";

export default function App() {
  const [fileKey, setFileKey] = useState<LocalFileWithKey["key"] | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  function openFileFromKey(key: IDBValidKey) {
    document.startViewTransition(() =>
      flushSync(() => {
        setEditorOpen(true);
        setFileKey(key);
      })
    );
  }

  const { data: fileEntry } = useIDBQuery({
    queryKey: ["fileQuery", fileKey],
    queryFn: (db) =>
      new Promise<LocalFileWithKey | null>((resolve, reject) => {
        if (fileKey === null) return resolve(null);
        const request = db
          .transaction("files", "readonly")
          .objectStore("files")
          .get(fileKey);

        request.onsuccess = () => resolve(request.result as LocalFileWithKey);
        request.onerror = () => reject(request.error);
      }),
  });

  const [fileName, setFileName] = useState<string>("unnamed File");

  // set filename for editor
  useEffect(() => {
    if (fileEntry) setFileName(fileEntry.name);
  }, [fileEntry]);

  if (!fileKey || editorOpen === false)
    return (
      <div className="flex flex-row flex-wrap items-center content-center justify-center gap-6 size-full">
        <Card key="chooseAFile" className="shadow min-w-80">
          <CardHeader>
            <CardTitle>Choose a File</CardTitle>
            <CardDescription>Only ASCII Files supported</CardDescription>
          </CardHeader>
          <CardContent>
            <FileChooser setFileKey={openFileFromKey} />
          </CardContent>
        </Card>
        <RecentFiles setFileKey={openFileFromKey} />
      </div>
    );

  if (fileKey !== undefined && editorOpen)
    return (
      <Editor
        fileKey={fileKey}
        fileHandle={fileEntry?.fileHandle || null}
        fileName={fileName}
        lastOpened={fileEntry?.lastOpened}
        closeFile={async () => {
          const transition = document.startViewTransition(() =>
            flushSync(() => setEditorOpen(false))
          );

          await transition.finished;
          setFileKey(null);
          setFileName("unnamed File");
        }}
      />
    );
}
