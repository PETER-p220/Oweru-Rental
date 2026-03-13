import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="theme-toggle-track">
        <div className={`theme-toggle-thumb ${isDark ? 'dark' : 'light'}`}>
          {isDark ? (
            <Moon size={14} className="theme-icon" />
          ) : (
            <Sun size={14} className="theme-icon" />
          )}
        </div>
      </div>
      <span className="theme-toggle-label">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </button>
  );
};

export default ThemeToggle;
