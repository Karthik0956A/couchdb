import { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>Event & RSVP Manager</h1>
        </div>
        {user && (
          <div className="navbar-menu">
            <span className="navbar-user">Welcome, {user.name}</span>
            <button onClick={logout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
