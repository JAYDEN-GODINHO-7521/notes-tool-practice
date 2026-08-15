import type { Label } from "../../types";

interface SidebarProps {
  labels: Label[];
  selectedLabelId: string | null;
  showArchived: boolean;
  onSelectAll: () => void;
  onSelectArchived: () => void;
  onSelectLabel: (labelId: string) => void;
  onOpenLabelManager: () => void;
}

function NavItem({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-r-full pl-6 pr-4 py-2.5 text-sm text-left transition-colors ${
        active ? "bg-moss/15 text-moss-dark font-medium" : "text-ink/70 hover:bg-line/40"
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function Sidebar({
  labels,
  selectedLabelId,
  showArchived,
  onSelectAll,
  onSelectArchived,
  onSelectLabel,
  onOpenLabelManager,
}: SidebarProps) {
  const showingAll = !showArchived && !selectedLabelId;

  return (
    <aside className="w-56 shrink-0 py-4 hidden md:block">
      <nav className="space-y-0.5">
        <NavItem active={showingAll} onClick={onSelectAll} icon="📝" label="Notes" />
        <NavItem active={showArchived} onClick={onSelectArchived} icon="🗄️" label="Archive" />
      </nav>

      {labels.length > 0 && (
        <>
          <div className="mt-4 mb-1 px-6 text-xs font-mono uppercase tracking-wider text-ink/40">
            Labels
          </div>
          <nav className="space-y-0.5">
            {labels.map((label) => (
              <NavItem
                key={label.id}
                active={selectedLabelId === label.id}
                onClick={() => onSelectLabel(label.id)}
                icon="🏷️"
                label={label.name}
              />
            ))}
          </nav>
        </>
      )}

      <button
        type="button"
        onClick={onOpenLabelManager}
        className="mt-3 w-full text-left pl-6 pr-4 py-2 text-xs text-ink/50 hover:text-moss"
      >
        Edit labels
      </button>
    </aside>
  );
}
