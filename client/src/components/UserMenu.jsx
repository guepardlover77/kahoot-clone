import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSoundContext } from '../context/SoundContext';

function UserMenu({ className = '' }) {
  const { user, isAuthenticated, login, logout } = useAuth();
  const { playClick } = useSoundContext();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    playClick();
    await logout();
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => {
          playClick();
          login();
        }}
        className={`flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all duration-200 ${className}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="font-medium">Connexion</span>
      </button>
    );
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => {
          playClick();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl transition-all duration-200"
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full border-2 border-white/50"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-kahoot-green flex items-center justify-center text-white font-bold">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-medium hidden sm:block">{user.name}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 z-50 animate-scale-in">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-800">{user.name}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>

          <Link
            to="/"
            onClick={() => {
              playClick();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-gray-700">Mes quiz</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
          >
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-red-600">Deconnexion</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
