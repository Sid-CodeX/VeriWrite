
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const DarkModeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    return savedTheme 
      ? savedTheme === 'dark' 
      : prefersDark;
  });

  // Apply theme whenever isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <button
      onClick={() => setIsDarkMode(!isDarkMode)}
      className="p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <Sun size={18} className="text-veri" />
      ) : (
        <Moon size={18} className="text-veri" />
      )}
    </button>
  );
};

export default DarkModeToggle;
