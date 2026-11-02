import { Switch } from "@/components/ui/switch";

export const SectionHeader = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => (
  <div className="flex flex-col gap-1 pr-8">
    <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
    {description && (
      <p className="text-sm text-muted-foreground">{description}</p>
    )}
  </div>
);

export const ToggleRow = ({
  id,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <label
    htmlFor={id}
    className={`flex items-center justify-between gap-4 px-4 py-3.5 transition-colors ${disabled ? "opacity-50" : "cursor-pointer hover:bg-white/[0.03]"}`}
  >
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </div>
    <Switch
      id={id}
      aria-label={label}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
    />
  </label>
);

/** Rounded group that separates its rows with hairlines. */
export const SettingsGroup = ({ children }: { children: React.ReactNode }) => (
  <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-card/40">
    {children}
  </div>
);
