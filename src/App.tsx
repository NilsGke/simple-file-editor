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
import { toast } from "./components/ui/use-toast";

export default function App() {
  const [fileKey, setFileKey] = useState<LocalFileWithKey["key"] | null>(null);

  const { data: fileEntry } = useIDBQuery({
    queryKey: ["fileQuery", fileKey],
    queryFn: (db) =>
      new Promise<LocalFileWithKey | null>((resolve, reject) => {
        console.log("refetch", fileKey);
        if (fileKey === null) return resolve(null);
        const request = db
          .transaction("files", "readonly")
          .objectStore("files")
          .get(fileKey);

        request.onsuccess = () => resolve(request.result as LocalFileWithKey);
        request.onerror = () => reject(request.error);
      }),
  });

  const [fileContents, setFileContents] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("unnamed File");

  // read initial file contents
  useEffect(() => {
    if (fileEntry)
      (async () => {
        const file = await fileEntry.fileHandle.getFile().catch((error) => {
          console.log(typeof error, { error });
          if (error.name.includes("NotFoundError"))
            toast({
              title: "File not found!",
              description:
                "The file has probably been moved or deleted from your filesystem.",
              variant: "destructive",
            });
          throw Error(error);
        });
        const contents = await file.text();
        setFileName(file.name);
        setFileContents(contents);
      })();
  }, [fileEntry]);

  console.log({ fileKey, fileEntry, fileContents });

  if (!fileKey)
    return (
      <div className="flex flex-row flex-wrap items-center content-center justify-center gap-6 size-full">
        <Card key="chooseAFile" className="shadow min-w-80">
          <CardHeader>
            <CardTitle>Choose a File</CardTitle>
            <CardDescription>Only ASCII Files supported</CardDescription>
          </CardHeader>
          <CardContent>
            <FileChooser setFileKey={(fileKey) => setFileKey(fileKey)} />
          </CardContent>
          {/* <CardFooter></CardFooter> */}
        </Card>
        <RecentFiles setFileKey={setFileKey} />
      </div>
    );

  if (fileKey !== undefined)
    return (
      <Editor
        fileHandle={fileEntry?.fileHandle || null}
        fileName={fileName}
        closeFile={() => {
          setFileContents(null);
          setFileKey(null);
        }}
      />
    );
}
