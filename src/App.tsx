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

export default function App() {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(
    null
  );

  useEffect(() => {
    if (fileHandle !== null) console.log("got File handle", fileHandle);
  }, [fileHandle]);

  const [fileContents, setFileContents] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("unnamed File");

  // read initial file contents
  useEffect(() => {
    if (fileHandle)
      (async () => {
        const file = await fileHandle.getFile();
        const contents = await file.text();
        setFileName(file.name);
        setFileContents(contents);
      })();
  }, [fileHandle]);

  if (fileHandle === null)
    return (
      fileHandle === null && (
        <div className="flex flex-col items-center justify-center gap-2 size-full">
          <Card className="shadow">
            <CardHeader>
              <CardTitle>Choose a File</CardTitle>
              <CardDescription>Only ASCII Files supported</CardDescription>
            </CardHeader>
            <CardContent>
              <FileChooser setFileHandle={setFileHandle} />
            </CardContent>
            {/* <CardFooter></CardFooter> */}
          </Card>
        </div>
      )
    );

  if (fileHandle !== null && fileContents === null)
    return <div>loading File Contents...</div>;

  if (fileHandle !== null && fileContents !== null)
    return (
      <Editor
        fileName={fileName}
        initialFileContents={fileContents}
        closeFile={() => {
          setFileContents(null);
          setFileHandle(null);
        }}
        saveFile={async (content) => {
          const writable = await fileHandle
            .createWritable({
              keepExistingData: false,
            })
            .catch((reason) => {
              console.error(reason);
              throw "could not create writable";
            });
          await writable.write(content).catch((reason) => {
            console.error(reason);
            throw "could not write to file";
          });

          await writable.close().catch((reason) => {
            console.error(reason);
            throw `Error: ${reason}`;
          });
        }}
      />
    );
}
