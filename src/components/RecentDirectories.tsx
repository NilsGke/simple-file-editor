import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { Button } from "./ui/button";
import { twMerge } from "tailwind-merge";
import useIDBStatus from "@/db/lib/hooks/useIDBStatus";
import {
  LocalDirectory,
  LocalFile,
  LocalFileWithKey,
  removeDirectoryFromDb,
  WithKey,
} from "@/db/db";
import useIDBQuery from "@/db/lib/hooks/useIDBQuery";
import { useToast } from "./ui/use-toast";
import { ToastAction } from "./ui/toast";
import useIDB from "@/db/lib/hooks/useIDB";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export default function RecentDirectories({
  setDirectoryKey,
}: {
  setDirectoryKey: (key: WithKey<LocalDirectory>["key"]) => void;
}) {
  const { toast, dismiss } = useToast();

  const dbStatus = useIDBStatus();
  const db = useIDB();

  const [containerRef] = useAutoAnimate<HTMLDivElement>();

  const {
    data: recentDirectories,
    error,
    status,
    refetch,
  } = useIDBQuery({
    queryKey: ["getAllDirectoriesWithKey"],
    queryFn: (db) =>
      new Promise<WithKey<LocalDirectory>[]>((resolve, reject) => {
        if (db === null) return reject("db inaccessable");

        const request = db
          .transaction("directories", "readonly")
          .objectStore("directories")
          .openCursor();

        const directories: WithKey<LocalDirectory>[] = [];

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor === null)
            return resolve(
              directories.sort((a, b) => b.lastOpened - a.lastOpened),
            );

          const directory = cursor.value as LocalDirectory;
          const key = cursor.key;

          directories.push({ ...directory, key });

          cursor.continue();
        };

        request.onerror = () => reject(request.error);
      }),
  });

  const checkExistance = async (directoryEntry: WithKey<LocalDirectory>) =>
    await directoryEntry.handle
      .entries()
      .next()
      .catch((error) => {
        console.error(error);
        if (error.name === "NotFoundError")
          toast({
            title: "Directory not found!",
            description:
              "The directory has probably been moved or deleted from your filesystem.",
            variant: "destructive",
            action: (
              <ToastAction
                altText="remove directory from recents list"
                onClick={() => {
                  if (db === null)
                    return toast({
                      title: "Database not loaded yet",
                      description: "This sould not happen",
                      variant: "destructive",
                    });
                  removeDirectoryFromDb(db, directoryEntry.key).then(() =>
                    refetch(),
                  );
                }}
              >
                Remove Directory from Recents list
              </ToastAction>
            ),
          });
        else
          toast({
            title: "Error",
            description: String(error),
            variant: "destructive",
          });
        throw Error(error);
      });

  const requestPermission = (directoryHandle: FileSystemDirectoryHandle) =>
    new Promise<void>((resolve) =>
      directoryHandle
        .requestPermission({ mode: "readwrite" })
        .then((permissionState) => {
          if (permissionState === "granted") resolve();
          else {
            toast({
              title: "Permission denied!",
              description: "Please accept read/write permission!",
              variant: "destructive",
              action: (
                <ToastAction
                  altText="retry"
                  onClick={() => {
                    dismiss();
                    requestPermission(directoryHandle).then(resolve);
                  }}
                >
                  retry
                </ToastAction>
              ),
            });
            console.error("Directory permissions denied on prompt");
          }
        }),
    );

  if (dbStatus !== "ready")
    return (
      <Card className="shadow min-w-96" key="migratingDB">
        <CardHeader>
          <CardTitle>Recent Directories</CardTitle>
          <CardDescription>Migrating Local Database...</CardDescription>
        </CardHeader>
        <CardContent>
          This might take some time <br />
          Please do not close this tab
        </CardContent>
      </Card>
    );

  return (
    <Card className="shadow w-96" key="recentDirectories">
      <CardHeader>
        <CardTitle>Recent Directories</CardTitle>
        <CardDescription
          className={twMerge(status === "error" && "text-red-400")}
        >
          {status === "pending" && "getting recent directories..."}
          {status === "error" && "Error!"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "error" && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Error Details</AccordionTrigger>
              <AccordionContent>
                <pre className="p-1 text-xs whitespace-normal border border-red-300 rounded max-w-72 border-1">
                  {error.message}
                </pre>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>What can i do about it?</AccordionTrigger>
              <AccordionContent>
                Reset this pages data and reload the page. <br /> Or use this
                button <br />
                <Button variant="destructive">Reset All Contents</Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <div className="flex flex-wrap gap-2" ref={containerRef}>
          {status === "pending" &&
            Array.from(Array(3)).map((_, a) => <RecentFile key={a} />)}

          {status === "success" &&
            recentDirectories.map((file) => (
              <RecentFile
                key={
                  typeof file.key !== "number" &&
                  typeof file.key !== "string" &&
                  typeof file.key !== "symbol"
                    ? file.lastOpened + file.name
                    : file.key
                }
                file={{
                  key: file.key,
                  name: file.name,
                  lastOpened: file.lastOpened,
                }}
                open={async () => {
                  await requestPermission(file.handle);
                  await checkExistance(file);
                  document
                    .startViewTransition(() => setDirectoryKey(file.key))
                    .finished.then(() => dismiss());
                }}
              />
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentFile({
  file,
  open,
}: {
  file?: {
    key: LocalFileWithKey["key"];
    name: LocalFile["name"];
    lastOpened: LocalFile["lastOpened"];
  };
  open?: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className="w-auto h-auto p-0"
      onClick={file && open && open}
    >
      <Card
        className="bg-transparent"
        style={{
          viewTransitionName: file
            ? `container-${String(file.key)}`
            : undefined,
        }}
      >
        <CardHeader
          className="p-2"
          style={{
            viewTransitionName: file ? `filename-${file.key}` : undefined,
          }}
        >
          {!file && <Skeleton className="w-[90px] h-4" />}
          {file?.name}
        </CardHeader>
      </Card>
    </Button>
  );
}
