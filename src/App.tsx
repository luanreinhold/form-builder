import { AppShell } from "./components/layout/AppShell";
import { AlertDialogHost } from "./components/ui/AlertDialog";
import { FieldPickerHost } from "./components/ui/FieldPickerDialog";
import { ToastHost } from "./components/ui/Toast";

export default function App() {
  return (
    <>
      <AppShell />
      <AlertDialogHost />
      <FieldPickerHost />
      <ToastHost />
    </>
  );
}
