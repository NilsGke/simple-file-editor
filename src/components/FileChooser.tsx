import { addFileToDb, findFileInDb, LocalFileWithKey } from "@/db/db";
import DropZone from "./DropZone";
import FileNameDialog from "./FileNameDialog";
import { Button } from "./ui/button";
import { ToastAction } from "./ui/toast";
import { useToast } from "./ui/use-toast";
import useIDB from "@/db/lib/hooks/useIDB";

export default function FileChooser({
  setFileKey,
}: {
  setFileKey: (fileKey: LocalFileWithKey["key"]) => void;
}) {
  const db = useIDB();
  const { toast, dismiss } = useToast();

  const openFile = async () => {
    dismiss();

    if (db === null) {
      toast({
        variant: "destructive",
        title: "IndexedDB not avalible",
        description: "Please wait for migrations to finish and try again",
        action: (
          <ToastAction altText="retry" onClick={openFile}>
            retry
          </ToastAction>
        ),
      });
      return;
    }

    // get file
    const [fileHandle] = await window
      .showOpenFilePicker({ multiple: false })
      .catch((reason) => {
        toast({ title: "No file selected", variant: "destructive" });
        throw reason;
      });

    if (fileHandle === undefined) {
      toast({
        title: "No File selected!",
        variant: "destructive",
      });
      return;
    }

    handleExistingFile(fileHandle, db);
  };

  const handleExistingFile = async (
    fileHandle: FileSystemFileHandle,
    db: IDBDatabase
  ) => {
    const existingDBEntry = await findFileInDb(db, fileHandle).catch(
      () => null
    );
    console.log("need to handle existing file", existingDBEntry);

    await managePermission(fileHandle);

    if (existingDBEntry === null) {
      const key = await addFileToDb(db, {
        fileHandle,
        lastOpened: Date.now(),
        name: (await fileHandle.getFile()).name,
      });
      console.log("generated new entry: ", key);
      setFileKey(key);
    } else {
      console.log("found existing key", existingDBEntry.key);
      setFileKey(existingDBEntry.key);
    }
  };

  const newFile = async (fileName: string) => {
    dismiss();

    if (db === null) {
      toast({
        variant: "destructive",
        title: "IndexedDB not avalible",
        description: "Please wait for migrations to finish and try again",
        action: (
          <ToastAction altText="retry" onClick={() => newFile(fileName)}>
            retry
          </ToastAction>
        ),
      });
      return;
    }

    const fileHandle = await window.showSaveFilePicker({
      suggestedName: fileName,
    });

    const key = await addFileToDb(db, {
      fileHandle,
      lastOpened: Date.now(),
      name: fileName,
    });

    managePermission(fileHandle);
    setFileKey(key);
  };

  const managePermission = async (file: FileSystemFileHandle) => {
    // check / get permissions
    const perms = await file.queryPermission({ mode: "readwrite" });
    return new Promise<void>((resolve, reject) => {
      if (perms === "denied") {
        toast({ title: "Permission Denied!", variant: "destructive" });
        return reject();
      }

      if (perms === "granted") return resolve();

      // need to prompt for permission
      requestPermission(file)
        .then(() => {
          console.log("granted");
          dismiss();
          resolve();
        })
        .catch((err) => console.error(err));
    });
  };

  const requestPermission = (file: FileSystemFileHandle) => {
    dismiss();
    toast({
      title: "Please grant premission to read and write the File",
    });
    return new Promise<void>((resolve) =>
      file.requestPermission({ mode: "readwrite" }).then((permissionState) => {
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
                  requestPermission(file).then(resolve);
                }}
              >
                retry
              </ToastAction>
            ),
          });
          console.error("File permissions denied on prompt");
        }
      })
    );
  };

  return (
    <div className="grid grid-cols-2 grid-rows-[1fr_1.5fr] gap-2">
      <Button onClick={() => openFile()}>Choose File</Button>
      <FileNameDialog trigger={<Button>New File</Button>} submit={newFile} />
      <DropZone
        processFileHandle={(fileHandle) => {
          if (db === null) {
            toast({
              variant: "destructive",
              title: "IndexedDB not avalible",
              description: "Please wait for migrations to finish and try again",
              action: (
                <ToastAction altText="retry" onClick={openFile}>
                  retry
                </ToastAction>
              ),
            });
            return;
          }
          handleExistingFile(fileHandle, db);
        }}
      />
    </div>
  );
}
