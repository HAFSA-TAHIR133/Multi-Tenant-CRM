import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMantineColorScheme } from '@mantine/core';

export default function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    const isDark = colorScheme === 'dark';
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setDark(isDark);
  }, [colorScheme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => toggleColorScheme()}
      aria-label="Toggle theme"
      className="text-foreground hover:text-foreground/80"
    >
      {dark ? (
        <Sun className="h-5 w-5 text-white" />
      ) : (
        <Moon className="h-5 w-5 text-black" />
      )}
    </Button>
  );
}