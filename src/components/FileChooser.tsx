import {
  addDirectoryToDb,
  findDirectoryInDb,
  LocalDirectory,
  WithKey,
} from "@/db/db";
import DropZone from "./DropZone";
import { Button } from "./ui/button";
import { ToastAction } from "./ui/toast";
import { useToast } from "./ui/use-toast";
import useIDB from "@/db/lib/hooks/useIDB";

export default function DirectoryChooser({
  setDirectoryKey,
}: {
  setDirectoryKey: (directoryKey: WithKey<LocalDirectory>["key"]) => void;
}) {
  const db = useIDB();
  const { toast, dismiss } = useToast();

  const openDirectory = async () => {
    dismiss();

    if (db === null) {
      toast({
        variant: "destructive",
        title: "IndexedDB not avalible",
        description: "Please wait for migrations to finish and try again",
        action: (
          <ToastAction altText="retry" onClick={openDirectory}>
            retry
          </ToastAction>
        ),
      });
      return;
    }

    const directoryHandle = await window
      .showDirectoryPicker({})
      .catch((reason) => {
        toast({ title: "No file selected", variant: "destructive" });
        throw reason;
      });

    if (directoryHandle === undefined) {
      toast({
        title: "No Directory selected!",
        variant: "destructive",
      });
      return;
    }

    handleExistingDirectory(directoryHandle, db);
  };

  const handleExistingDirectory = async (
    directoryHandle: FileSystemDirectoryHandle,
    db: IDBDatabase,
  ) => {
    const existingDBEntry = await findDirectoryInDb(db, directoryHandle).catch(
      () => null,
    );

    await managePermission(directoryHandle);

    if (existingDBEntry === null) {
      const key = await addDirectoryToDb(db, {
        handle: directoryHandle,
        lastOpened: Date.now(),
        name: directoryHandle.name,
      });
      setDirectoryKey(key);
    } else {
      setDirectoryKey(existingDBEntry.key);
    }
  };

  const managePermission = async (directory: FileSystemDirectoryHandle) => {
    // check / get permissions
    const perms = await directory.queryPermission({ mode: "readwrite" });
    return new Promise<void>((resolve, reject) => {
      if (perms === "denied") {
        toast({ title: "Permission Denied!", variant: "destructive" });
        return reject();
      }

      if (perms === "granted") return resolve();

      // need to prompt for permission
      requestPermission(directory)
        .then(() => {
          dismiss();
          resolve();
        })
        .catch((err) => console.error(err));
    });
  };

  const requestPermission = (directory: FileSystemDirectoryHandle) => {
    dismiss();
    toast({
      title: "Please grant premission to read and write the File",
    });
    return new Promise<void>((resolve) =>
      directory
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
                    requestPermission(directory).then(resolve);
                  }}
                >
                  retry
                </ToastAction>
              ),
            });
            console.error("File permissions denied on prompt");
          }
        }),
    );
  };

  return (
    <div className="grid grid-cols-2 grid-rows-[1fr_1.5fr] gap-2">
      <Button onClick={() => openDirectory()}>Choose directory</Button>
      <DropZone
        processDirectoryHandle={(fileHandle) => {
          if (db === null) {
            toast({
              variant: "destructive",
              title: "IndexedDB not avalible",
              description: "Please wait for migrations to finish and try again",
              action: (
                <ToastAction altText="retry" onClick={openDirectory}>
                  retry
                </ToastAction>
              ),
            });
            return;
          }
          handleExistingDirectory(fileHandle, db);
        }}
      />
    </div>
  );
}
