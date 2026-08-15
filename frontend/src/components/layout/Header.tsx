import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface HeaderProps {
  search?: string;
  onSearchChange?: (value: string) => void;
}

export default function Header({ search, onSearchChange }: HeaderProps) {
  const { user, logout, setNotesView } = useAuth();
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
              className="w-full rounded-full border border-line bg-white px-4 py-1.5 text-sm shadow-3d-static focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
            />
          </div>
        )}

        <nav className="ml-auto flex items-center gap-4 text-sm font-sans">
          {onDashboard && user && (
            <div className="flex items-center gap-1 rounded-full border border-line bg-white p-0.5">
              <button
                type="button"
                onClick={() => setNotesView("grid")}
                title="Grid view"
                className={`rounded-full px-2.5 py-1 text-xs ${
                  user.notes_view === "grid" ? "bg-moss/15 text-moss-dark" : "text-ink/50 hover:text-ink"
                }`}
              >
                ▦
              </button>
              <button
                type="button"
                onClick={() => setNotesView("list")}
                title="List view"
                className={`rounded-full px-2.5 py-1 text-xs ${
                  user.notes_view === "list" ? "bg-moss/15 text-moss-dark" : "text-ink/50 hover:text-ink"
                }`}
              >
                ☰
              </button>
            </div>
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
