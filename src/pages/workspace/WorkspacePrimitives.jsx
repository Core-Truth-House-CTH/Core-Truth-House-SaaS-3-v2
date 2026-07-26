import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, FolderOpen, X } from "lucide-react";

export function Pill({ children, tone = "default" }) {
  return <span className={`ws-pill ${tone}`}>{children}</span>;
}

export function Empty({ icon: Icon = FolderOpen, title, description }) {
  return (
    <div className="ws-empty">
      <Icon size={22} />
      <h3>{title}</h3>
      <p>{description}</p>
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
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close className="ws-icon-btn" aria-label="Close">
              <X size={17} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function SelectField({ value, onValueChange, options, label }) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className="ws-select-trigger" aria-label={label}>
        <Select.Value />
        <Select.Icon><ChevronDown size={15} /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="ws-select-content" position="popper">
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item key={option.value} value={option.value} className="ws-select-item">
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator><Check size={14} /></Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
