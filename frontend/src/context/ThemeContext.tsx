import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ThemeContext, type Theme } from './theme-context';

const THEME_STORAGE_KEY = 'voice-news-theme';

const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'dark';
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === 'light' ? 'light' : 'dark';
};

const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());
    const hasMounted = useRef(false);

    useEffect(() => {
        const root = document.documentElement;
        if (hasMounted.current) {
            root.classList.add('theme-transition');
            window.setTimeout(() => {
                root.classList.remove('theme-transition');
            }, 200);
        }

        applyTheme(theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        hasMounted.current = true;
    }, [theme]);

    const setTheme = useCallback((nextTheme: Theme) => {
        setThemeState(nextTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const contextValue = useMemo(
        () => ({
            theme,
            setTheme,
            toggleTheme
        }),
        [theme, setTheme, toggleTheme]
    );

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};
