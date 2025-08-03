import { useState, useCallback } from 'react';
import type { WindowPosition } from '../types';

export function useWindowDrag() {
    const [isDragging, setIsDragging] = useState(false);
    const [activeWindow, setActiveWindow] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e: React.MouseEvent, windowId: string) => {
        e.preventDefault();
        setActiveWindow(windowId);
        setIsDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        
        // Add dragging class to the window
        const windowElement = e.currentTarget.closest('.vscode-window, .terminal-window');
        if (windowElement) {
            windowElement.classList.add('dragging');
        }
    }, []);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (isDragging && activeWindow) {
                const newPosition: WindowPosition = {
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y,
                };
                
                // Return the new position for the active window
                return { windowId: activeWindow, position: newPosition };
            }
            return null;
        },
        [isDragging, activeWindow, dragOffset],
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        // Don't clear activeWindow - keep the window on top
        
        // Remove dragging class from all windows
        document.querySelectorAll('.vscode-window, .terminal-window').forEach(element => {
            element.classList.remove('dragging');
        });
    }, []);

    return {
        isDragging,
        activeWindow,
        dragOffset,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
    };
} 