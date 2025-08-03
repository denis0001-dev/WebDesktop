import { useState, useCallback, useEffect, useRef } from 'react';
import type { SystemMonitorWindow } from '../types';

export function useSystemMonitor() {
    const [systemMonitorWindows, setSystemMonitorWindows] = useState<SystemMonitorWindow[]>([
        {
            id: "system-monitor-1",
            isOpen: false,
            position: { x: 300, y: 300 },
            width: 600,
            height: 400,
            data: null,
        },
    ]);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleSystemMonitorClick = useCallback(() => {
        setSystemMonitorWindows((prev) =>
            prev.map((window) =>
                window.id === "system-monitor-1" ? { ...window, isOpen: true } : window,
            ),
        );
    }, []);

    const handleSystemMonitorClose = useCallback((windowId: string) => {
        setSystemMonitorWindows((prev) =>
            prev.map((window) =>
                window.id === windowId ? { ...window, isOpen: false, data: null } : window,
            ),
        );
    }, []);

    const updateSystemMonitorWindow = useCallback((windowId: string, updates: Partial<SystemMonitorWindow>) => {
        setSystemMonitorWindows((prev) =>
            prev.map((window) =>
                window.id === windowId ? { ...window, ...updates } : window,
            ),
        );
    }, []);

    const fetchSystemData = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3001/api/system/stats');
            if (response.ok) {
                const data = await response.json();
                setSystemMonitorWindows((prev) =>
                    prev.map((window) =>
                        window.isOpen ? { ...window, data } : window,
                    ),
                );
            }
        } catch (error) {
            console.error('Failed to fetch system data:', error);
        }
    }, []);

    // Start polling when any system monitor window is open
    useEffect(() => {
        const hasOpenWindow = systemMonitorWindows.some(window => window.isOpen);
        
        if (hasOpenWindow) {
            // Fetch initial data
            fetchSystemData();
            
            // Start polling every 2 seconds
            intervalRef.current = setInterval(fetchSystemData, 2000);
        } else {
            // Stop polling when no windows are open
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [systemMonitorWindows.some(window => window.isOpen), fetchSystemData]);

    return {
        systemMonitorWindows,
        handleSystemMonitorClick,
        handleSystemMonitorClose,
        updateSystemMonitorWindow,
    };
} 