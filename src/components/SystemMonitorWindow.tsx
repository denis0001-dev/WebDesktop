import React from 'react';
import type { SystemMonitorWindow as SystemMonitorWindowType } from '../types';

interface SystemMonitorWindowProps {
    window: SystemMonitorWindowType;
    activeWindow: string | null;
    onMouseDown: (e: React.MouseEvent, windowId: string) => void;
    onClose: (windowId: string) => void;
}

export default function SystemMonitorWindow({
    window,
    activeWindow,
    onMouseDown,
    onClose,
}: SystemMonitorWindowProps) {
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

    const formatBytes = (bytes: number) => {
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    const createProgressBar = (value: number, max: number, color: string) => (
        <div style={{ width: '100%', height: '8px', backgroundColor: '#2a2a2a', borderRadius: '4px', overflow: 'hidden' }}>
            <div 
                style={{ 
                    width: `${(value / max) * 100}%`, 
                    height: '100%', 
                    backgroundColor: color,
                    transition: 'width 0.3s ease'
                }} 
            />
        </div>
    );

    return (
        <div
            className="system-monitor-window"
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
                <div className="window-title">System Monitor</div>
                <div className="window-controls">
                    <button
                        className="window-close"
                        onClick={() => onClose(window.id)}
                    >
                        ×
                    </button>
                </div>
            </div>
            <div className="system-monitor-content">
                {window.data ? (
                    <div style={{ padding: '20px', color: '#fff' }}>
                        {/* CPU Usage */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>CPU Usage</span>
                                <span style={{ fontSize: '14px' }}>{window.data.cpu.toFixed(1)}%</span>
                            </div>
                            {createProgressBar(window.data.cpu, 100, '#ff6b6b')}
                        </div>

                        {/* Memory Usage */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Memory</span>
                                <span style={{ fontSize: '14px' }}>
                                    {formatBytes(window.data.memory.used)} / {formatBytes(window.data.memory.total)}
                                </span>
                            </div>
                            {createProgressBar(window.data.memory.used, window.data.memory.total, '#4ecdc4')}
                            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                Free: {formatBytes(window.data.memory.free)}
                            </div>
                        </div>

                        {/* Disk Usage */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Disk</span>
                                <span style={{ fontSize: '14px' }}>
                                    {formatBytes(window.data.disk.used)} / {formatBytes(window.data.disk.total)}
                                </span>
                            </div>
                            {createProgressBar(window.data.disk.used, window.data.disk.total, '#45b7d1')}
                            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                Free: {formatBytes(window.data.disk.free)}
                            </div>
                        </div>

                        {/* Network */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Network</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                <span>Download: {formatBytes(window.data.network.rx)}/s</span>
                                <span>Upload: {formatBytes(window.data.network.tx)}/s</span>
                            </div>
                        </div>

                        {/* Uptime */}
                        <div>
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Uptime</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#888' }}>
                                {formatUptime(window.data.uptime)}
                            </div>
                        </div>
                    </div>
                ) : (
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
                        <p>Loading system data...</p>
                    </div>
                )}
            </div>
        </div>
    );
} 