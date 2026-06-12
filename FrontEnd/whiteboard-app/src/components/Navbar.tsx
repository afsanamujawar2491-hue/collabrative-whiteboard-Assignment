import { useAuth } from "../auth/AuthContext";

interface NavbarProps {
  title?: string;
  children?: React.ReactNode;
}

function Navbar({ title, children }: NavbarProps) {
  const { user, logout, login, register, isAuthenticated } = useAuth();

  return (
    <nav className="navbar navbar-dark bg-dark px-3">
      <span className="navbar-brand mb-0 h1 fs-5">
        Whiteboard
        {title && <span className="text-muted ms-2 fw-normal fs-6">{title}</span>}
      </span>
      <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
        {children}
        {isAuthenticated ? (
          <>
            <span className="text-light small d-none d-md-inline">
              {user?.username}
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={logout} type="button">
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-outline-light btn-sm" onClick={() => login()} type="button">
              Login
            </button>
            <button className="btn btn-light btn-sm" onClick={() => register()} type="button">
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
