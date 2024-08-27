import { ReactNode, useRef, useState } from "react";
import {
  DialogHeader,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

export default function FileNameDialog({
  trigger,
  submit,
}: {
  trigger: ReactNode;
  submit: (newFileName: string) => void;
}) {
  const [fileName, setFileName] = useState("");
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>What should your file be named</DialogTitle>
          <DialogDescription>Enter a filename</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="name" className="text-right">
            File Name
          </Label>
          <Input
            id="name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            onSubmit={() => submit(fileName)}
            onKeyDown={({ key, altKey, ctrlKey }) => {
              if (
                key === "Enter" &&
                !altKey &&
                !ctrlKey &&
                submitButtonRef.current !== null
              )
                // we cannot call `submit()` from here because the dialog wont close
                submitButtonRef.current.click();
            }}
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            ref={submitButtonRef}
            onClick={() => submit(fileName)}
          >
            Save File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
