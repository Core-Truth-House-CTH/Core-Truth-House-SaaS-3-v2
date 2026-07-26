import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import { X } from "lucide-react";
import apiClient from "../../lib/apiClient";
import { API_PATHS } from "../../lib/apiPaths";

export const messageFor = (error) =>
  error?.response?.data?.detail || error?.message || "The request could not be completed.";

export function Pill({ children, tone = "default" }) {
  return <span className={`ws-pill ${tone}`}>{children}</span>;
}

export function Status({ children, tone = "default" }) {
  return children ? <div className={`ws-inline-message ${tone}`}>{children}</div> : null;
}

export function Toggle({ label, description, checked, onCheckedChange, disabled }) {
  return (
    <div className="ws-toggle-row">
      <div><strong>{label}</strong><p>{description}</p></div>
      <Switch.Root className="ws-switch" checked={checked} onCheckedChange={onCheckedChange} disabled={disabled}>
        <Switch.Thumb className="ws-switch-thumb" />
      </Switch.Root>
    </div>
  );
}

export function Modal({ open, onOpenChange, title, description, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ws-dialog-overlay" />
        <Dialog.Content className="ws-dialog-content">
          <div className="ws-dialog-head">
            <div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div>
            <Dialog.Close className="ws-icon-btn"><X size={17} /></Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export async function saveSettings(data, patch) {
  await apiClient.patch(API_PATHS.workspace.settings(data.activeWorkspaceId), patch);
  await data.reload();
}
