import DropZone from "./Dropzone";
import FileNameDialog from "./FileNameDialog";
import { Button } from "./ui/button";
import { ToastAction } from "./ui/toast";
import { useToast } from "./ui/use-toast";

export default function FileChooser({
  setFileHandle,
}: {
  setFileHandle: (fileHandle: FileSystemFileHandle) => void;
}) {
  const { toast, dismiss } = useToast();

  const openFile = async () => {
    dismiss();

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

    managePermission(fileHandle);
  };

  const newFile = async (fileName: string) => {
    dismiss();
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
    });

    managePermission(handle);
  };

  const managePermission = async (file: FileSystemFileHandle) => {
    // check / get permissions
    const perms = await file.queryPermission({ mode: "readwrite" });
    if (perms === "denied") {
      toast({ title: "Permission Denied!", variant: "destructive" });
      return;
    }
    if (perms === "granted") {
      setFileHandle(file);
      return;
    }

    // need to prompt for permission
    await requestPermission(file)
      .then(() => {
        console.log("granted");
        dismiss();
        setFileHandle(file);
      })
      .catch((err) => console.error(err));
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
      <DropZone setFileHandle={setFileHandle} />
    </div>
  );
}
