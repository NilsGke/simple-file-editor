import { useState } from "react";
import DirectoryChooser from "./components/FileChooser";
import Editor from "./components/Editor";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import RecentDirectories from "./components/RecentDirectories";
import { LocalDirectory, LocalFileWithKey, WithKey } from "./db/db";
import useIDBQuery from "./db/lib/hooks/useIDBQuery";
import FileTree from "./components/ui/FileTree";
import TabBar from "./components/ui/TabBar";

export default function App() {
  const [directoryKey, setDirectoryKey] = useState<
    LocalFileWithKey["key"] | null
  >(null);

  const { data: directoryEntry } = useIDBQuery({
    queryKey: ["directoryQuery", directoryKey],
    queryFn: (db) =>
      new Promise<WithKey<LocalDirectory> | null>((resolve, reject) => {
        if (directoryKey === null) return resolve(null);
        const request = db
          .transaction("directories", "readonly")
          .objectStore("directories")
          .get(directoryKey);

        request.onsuccess = () =>
          resolve({
            key: directoryKey,
            ...request.result,
          });
        request.onerror = () => reject(request.error);
      }),
  });

  if (!directoryKey)
    return (
      <div className="flex flex-row flex-wrap items-center content-center justify-center gap-6 size-full">
        <Card key="chooseAFile" className="shadow min-w-80">
          <CardHeader>
            <CardTitle>Open a Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <DirectoryChooser setDirectoryKey={setDirectoryKey} />
          </CardContent>
        </Card>
        <RecentDirectories setDirectoryKey={setDirectoryKey} />
      </div>
    );

  if (directoryKey && !directoryEntry) <div>loading directory...</div>;

  if (directoryKey && directoryEntry)
    return (
      <div className="py-4 h-screen gap-x-8 grid grid-cols-[auto,1fr] grid-rows-[auto,1fr]">
        <div className="row-span-2 font-mono text-sm">
          <FileTree directoryHandle={directoryEntry.handle!} />
        </div>

        <TabBar />
        <Editor />
      </div>
    );
}
