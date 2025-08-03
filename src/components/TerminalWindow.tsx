import React from 'react';
import TerminalComponent from './Terminal';
import type { TerminalWindow as TerminalWindowType } from '../types';

interface TerminalWindowProps {
    window: TerminalWindowType;
    activeWindow: string | null;
    onMouseDown: (e: React.MouseEvent, windowId: string) => void;
    onClose: (windowId: string) => void;
    onData: (data: string) => void;
    onResize: (cols: number, rows: number) => void;
    onTerminalRef: (windowId: string, ref: { writeData: (data: string) => void } | null) => void;
}

export default function TerminalWindow({
    window,
    activeWindow,
    onMouseDown,
    onClose,
    onData,
    onResize,
    onTerminalRef,
}: TerminalWindowProps) {
    if (!window.isOpen) return null;

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only handle drag if not clicking on resize handle
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const isResizeHandle = x > rect.width - 20 && y > rect.height - 20;
        
        if (!isResizeHandle) {
            onMouseDown(e, window.id);
        }
    };

    return (
        <div
            className="terminal-window"
            data-window-id={window.id}
            style={{
                left: window.position.x,
                top: window.position.y,
                width: window.width,
                height: window.height,
                zIndex: activeWindow === window.id ? 1000 : 100,
            }}
            onMouseDown={handleMouseDown}
        >
            <div
                className="window-header"
                onMouseDown={(e) => onMouseDown(e, window.id)}
            >
                <div className="window-title">Terminal</div>
                <div className="window-controls">
                    <button
                        className="window-close"
                        onClick={() => onClose(window.id)}
                    >
                        ×
                    </button>
                </div>
            </div>
            <div className="terminal-content">
                <TerminalComponent
                    onData={onData}
                    onResize={onResize}
                    isConnected={window.connected}
                    onRef={(ref) => onTerminalRef(window.id, ref)}
                />
            </div>
        </div>
    );
} 