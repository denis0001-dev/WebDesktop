import { useState, useCallback } from 'react';
import type { TerminalWindow } from '../types';

export function useTerminal() {
    const [terminalWindows, setTerminalWindows] = useState<TerminalWindow[]>([
        {
            id: "terminal-1",
            isOpen: false,
            position: { x: 100, y: 100 },
            connected: false,
            width: 800,
            height: 600,
        },
    ]);
    
    const [windowInitialized, setWindowInitialized] = useState<{ [key: string]: boolean }>({});

    const handleTerminalClick = useCallback(() => {
        setTerminalWindows((prev) =>
            prev.map((window) =>
                window.id === "terminal-1" ? { ...window, isOpen: true } : window,
            ),
        );

        // Reset initialization flag for this window
        setWindowInitialized(prev => ({ ...prev, "terminal-1": false }));
    }, []);

    const handleWindowClose = useCallback((windowId: string) => {
        setTerminalWindows((prev) =>
            prev.map((window) =>
                window.id === windowId ? { ...window, isOpen: false } : window,
            ),
        );
    }, []);

    const updateTerminalWindow = useCallback((windowId: string, updates: Partial<TerminalWindow>) => {
        setTerminalWindows((prev) =>
            prev.map((window) =>
                window.id === windowId ? { ...window, ...updates } : window,
            ),
        );
    }, []);

    const handleWindowResize = useCallback((windowId: string, newWidth: number, newHeight: number) => {
        setTerminalWindows((prev) =>
            prev.map((window) =>
                window.id === windowId
                    ? { ...window, width: newWidth, height: newHeight }
                    : window,
            ),
        );
    }, []);

    const updateAllTerminalConnections = useCallback((connected: boolean) => {
        setTerminalWindows((prev) =>
            prev.map((window) => ({ ...window, connected }))
        );
    }, []);

    return {
        terminalWindows,
        windowInitialized,
        setWindowInitialized,
        handleTerminalClick,
        handleWindowClose,
        updateTerminalWindow,
        updateAllTerminalConnections,
        handleWindowResize,
    };
} 