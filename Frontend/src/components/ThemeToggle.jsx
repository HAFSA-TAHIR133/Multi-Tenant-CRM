import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMantineColorScheme } from '@mantine/core';

export default function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = colorScheme === 'dark';

    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, [colorScheme]);

  if (!mounted) return null;

  const isDark = colorScheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => toggleColorScheme()}
      aria-label="Toggle theme"
      className="text-foreground hover:bg-accent"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-white" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700" />
      )}
    </Button>
  );
}