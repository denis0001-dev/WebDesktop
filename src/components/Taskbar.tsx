import type { ServerStatus } from '../types';

interface TaskbarProps {
    serverStatus: ServerStatus;
    onTerminalClick: () => void;
    onVSCodeClick: () => void;
    onSystemMonitorClick: () => void;
}

export default function Taskbar({
    serverStatus,
    onTerminalClick,
    onVSCodeClick,
    onSystemMonitorClick,
}: TaskbarProps) {
    return (
        <div className="taskbar">
            <div className="taskbar-left">
                <button className="start-menu-btn" title="Start Menu">
                    <span className="start-icon">⊞</span>
                </button>
            </div>
            <div className="taskbar-center">
                {/* Taskbar items would go here */}
            </div>
            <div className="taskbar-right">
                <div
                    className={`server-status ${serverStatus}`}
                    title={`Server: ${serverStatus}`}
                >
                    <span className="status-dot"></span>
                </div>
                <button
                    className="terminal-btn"
                    onClick={onTerminalClick}
                    title="Terminal"
                >
                    <span className="terminal-icon">⌨</span>
                </button>
                <button
                    className="vscode-btn"
                    onClick={onVSCodeClick}
                    title="VSCode"
                >
                    <span className="vscode-icon">💻</span>
                </button>
                <button
                    className="system-monitor-btn"
                    onClick={onSystemMonitorClick}
                    title="System Monitor"
                >
                    <span className="system-monitor-icon">📊</span>
                </button>
            </div>
        </div>
    );
} 