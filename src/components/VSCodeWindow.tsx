import React from 'react';
import type { VSCodeWindow as VSCodeWindowType } from '../types';

interface VSCodeWindowProps {
    window: VSCodeWindowType;
    activeWindow: string | null;
    onMouseDown: (e: React.MouseEvent, windowId: string) => void;
    onClose: (windowId: string) => void;
}

export default function VSCodeWindow({
    window,
    activeWindow,
    onMouseDown,
    onClose,
}: VSCodeWindowProps) {
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
            className="vscode-window"
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
                <div className="window-title">VSCode</div>
                <div className="window-controls">
                    <button
                        className="window-close"
                        onClick={() => onClose(window.id)}
                    >
                        ×
                    </button>
                </div>
            </div>
            <div className="vscode-content">
                {window.loading ? (
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        color: '#666'
                    }}>
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            border: '4px solid #f3f3f3', 
                            borderTop: '4px solid #3498db', 
                            borderRadius: '50%', 
                            animation: 'spin 1s linear infinite',
                            marginBottom: '16px'
                        }}></div>
                        <p>Starting VSCode...</p>
                        <p style={{ fontSize: '12px', marginTop: '8px' }}>This may take a few seconds</p>
                    </div>
                ) : window.url ? (
                    <iframe
                        src={window.url}
                        title="VSCode"
                        style={{ width: "100%", height: "100%" }}
                        onMouseDown={(e) => e.stopPropagation()}
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-top-navigation-by-user-activation allow-presentation allow-modals allow-downloads allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                        allow="usb; serial; hid; cross-origin-isolated"
                    />
                ) : (
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        color: '#666'
                    }}>
                        <p>VSCode not available.</p>
                        <p style={{ fontSize: '12px', marginTop: '8px' }}>Click the VSCode button to start</p>
                    </div>
                )}
            </div>
        </div>
    );
} 