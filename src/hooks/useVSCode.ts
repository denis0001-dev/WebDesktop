import { useState, useCallback } from 'react';
import type { VSCodeWindow } from '../types';

export function useVSCode() {
    const [vscodeWindows, setVscodeWindows] = useState<VSCodeWindow[]>([
        {
            id: "vscode-1",
            isOpen: false,
            position: { x: 200, y: 200 },
            width: 1200,
            height: 800,
            loading: false,
            url: null,
        },
    ]);

    const handleVSCodeClick = useCallback(async () => {
        setVscodeWindows((prev) =>
            prev.map((window) =>
                window.id === "vscode-1" ? { ...window, isOpen: true, loading: true } : window,
            ),
        );

        try {
            const response = await fetch('http://localhost:3001/api/vscode/start', {
                method: 'POST',
            });
            
            if (response.ok) {
                const data = await response.json();
                setVscodeWindows((prev) =>
                    prev.map((window) =>
                        window.id === "vscode-1" ? { ...window, loading: false, url: data.url } : window,
                    ),
                );
            } else {
                const errorData = await response.json();
                console.error('Failed to start VSCode:', errorData);
                setVscodeWindows((prev) =>
                    prev.map((window) =>
                        window.id === "vscode-1" ? { ...window, loading: false } : window,
                    ),
                );
                alert(`Failed to start VSCode: ${errorData.message || errorData.error}\n\n${errorData.details || ''}`);
            }
        } catch (error) {
            console.error('Error starting VSCode:', error);
            setVscodeWindows((prev) =>
                prev.map((window) =>
                    window.id === "vscode-1" ? { ...window, loading: false } : window,
                ),
            );
            alert('Failed to connect to VSCode server. Make sure the backend is running.');
        }
    }, []);

    const handleVSCodeClose = useCallback((windowId: string) => {
        setVscodeWindows((prev) =>
            prev.map((window) =>
                window.id === windowId ? { ...window, isOpen: false, url: null } : window,
            ),
        );
    }, []);

    const updateVSCodeWindow = useCallback((windowId: string, updates: Partial<VSCodeWindow>) => {
        setVscodeWindows((prev) =>
            prev.map((window) =>
                window.id === windowId ? { ...window, ...updates } : window,
            ),
        );
    }, []);

    return {
        vscodeWindows,
        handleVSCodeClick,
        handleVSCodeClose,
        updateVSCodeWindow,
    };
} 