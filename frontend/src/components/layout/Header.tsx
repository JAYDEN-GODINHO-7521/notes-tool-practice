import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface HeaderProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  showArchived?: boolean;
  onToggleArchived?: () => void;
}

export default function Header({
  search,
  onSearchChange,
  showArchived,
  onToggleArchived,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const onDashboard = location.pathname === "/";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-10 bg-paper/90 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
        <Link to="/" className="font-display text-2xl text-ink shrink-0">
          Keep
        </Link>

        {onDashboard && onSearchChange && (
          <div className="flex-1 max-w-md">
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes"
              className="w-full rounded-full border border-line bg-white px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
            />
          </div>
        )}

        <nav className="ml-auto flex items-center gap-4 text-sm font-sans">
          {onDashboard && onToggleArchived && (
            <button
              type="button"
              onClick={onToggleArchived}
              className="text-ink/60 hover:text-moss"
            >
              {showArchived ? "Active notes" : "Archived"}
            </button>
          )}
          <Link to="/study" className="text-ink/60 hover:text-moss">
            Study Hub
          </Link>
          <span className="text-ink/40 hidden sm:inline">{user?.name}</span>
          <button type="button" onClick={handleLogout} className="text-ink/60 hover:text-red-600">
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
