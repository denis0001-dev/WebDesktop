import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import DesktopBackground from "./components/DesktopBackground";
import TerminalWindow from "./components/TerminalWindow";
import VSCodeWindow from "./components/VSCodeWindow";
import SystemMonitorWindow from "./components/SystemMonitorWindow";
import Taskbar from "./components/Taskbar";
import { useWindowDrag } from "./hooks/useWindowDrag";
import { useTerminal } from "./hooks/useTerminal";
import { useVSCode } from "./hooks/useVSCode";
import { useSystemMonitor } from "./hooks/useSystemMonitor";
import { WebSocketService } from "./services/websocket";
import type { ServerStatus } from "./types";

export default function App() {
    const [serverStatus, setServerStatus] = useState<ServerStatus>("disconnected");
    const wsServiceRef = useRef<WebSocketService | null>(null);

    // Custom hooks
    const {
        isDragging,
        activeWindow,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
    } = useWindowDrag();

    const {
        terminalWindows,
        windowInitialized,
        setWindowInitialized,
        handleTerminalClick,
        handleWindowClose,
        updateTerminalWindow,
        updateAllTerminalConnections,
        handleWindowResize,
    } = useTerminal();

    const {
        vscodeWindows,
        handleVSCodeClick,
        handleVSCodeClose,
        updateVSCodeWindow,
    } = useVSCode();

    const {
        systemMonitorWindows,
        handleSystemMonitorClick,
        handleSystemMonitorClose,
        updateSystemMonitorWindow,
    } = useSystemMonitor();

    // WebSocket service initialization
    useEffect(() => {
        wsServiceRef.current = new WebSocketService(
            setServerStatus,
            (data: string) => {
                if (wsServiceRef.current) {
                    wsServiceRef.current.writeToActiveTerminal(activeWindow, data);
                }
            },
            (connected: boolean) => {
                // Update all terminal windows connection status
                updateAllTerminalConnections(connected);
            }
        );
    }, [activeWindow, updateAllTerminalConnections]);

    // WebSocket connection
    const connectWebSocket = useCallback(() => {
        if (wsServiceRef.current) {
            wsServiceRef.current.connect();
        }
    }, []);

    // Terminal data handler
    const handleTerminalData = useCallback(
        (data: string) => {
            if (wsServiceRef.current?.isConnected()) {
                wsServiceRef.current.send(JSON.stringify({
                    type: "tty_input",
                    data: data,
                }));
            } else {
                connectWebSocket();
            }
        },
        [connectWebSocket],
    );

    // Terminal resize handler
    const handleTerminalResize = useCallback(
        (cols: number, rows: number) => {
            if (wsServiceRef.current?.isConnected()) {
                wsServiceRef.current.send(
                    JSON.stringify({
                        type: "tty_resize",
                        data: JSON.stringify({ cols, rows }),
                    }),
                );
            }
        },
        [],
    );

    // Terminal ref handler
    const setTerminalRef = useCallback(
        (windowId: string, ref: { writeData: (data: string) => void } | null) => {
            if (wsServiceRef.current) {
                wsServiceRef.current.setTerminalRef(windowId, ref);
            }
        },
        [],
    );

    // Mouse event handlers
    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Window resize observer
    useEffect(() => {
        const resizeObservers: ResizeObserver[] = [];

        terminalWindows.forEach((window) => {
            if (window.isOpen) {
                const windowElement = document.querySelector(
                    `[data-window-id="${window.id}"]`
                ) as HTMLElement;
                
                if (windowElement) {
                    const resizeObserver = new ResizeObserver((entries) => {
                        for (const entry of entries) {
                            const { width, height } = entry.contentRect;
                            
                            if (!windowInitialized[window.id]) {
                                setWindowInitialized(prev => ({ ...prev, [window.id]: true }));
                                return;
                            }
                            
                            if (Math.abs(width - window.width) > 5 || Math.abs(height - window.height) > 5) {
                                handleWindowResize(window.id, width, height);
                            }
                        }
                    });
                    
                    resizeObserver.observe(windowElement);
                    resizeObservers.push(resizeObserver);
                }
            }
        });

        return () => {
            resizeObservers.forEach((observer) => observer.disconnect());
        };
    }, [terminalWindows, windowInitialized, handleWindowResize]);

    // Handle window dragging
    const handleWindowDrag = useCallback((e: MouseEvent) => {
        const result = handleMouseMove(e);
        if (result) {
            const { windowId, position } = result;
            
            if (windowId.startsWith('terminal-')) {
                updateTerminalWindow(windowId, { position });
            } else if (windowId.startsWith('vscode-')) {
                updateVSCodeWindow(windowId, { position });
            } else if (windowId.startsWith('system-monitor-')) {
                updateSystemMonitorWindow(windowId, { position });
            }
        }
    }, [handleMouseMove, updateTerminalWindow, updateVSCodeWindow, updateSystemMonitorWindow]);

    // Update mouse move handler to use window drag
    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleWindowDrag);
            return () => {
                document.removeEventListener("mousemove", handleWindowDrag);
            };
        }
    }, [isDragging, handleWindowDrag]);

    // Connect WebSocket when terminal is opened
    const handleTerminalOpen = useCallback(() => {
        handleTerminalClick();
        if (!wsServiceRef.current?.isConnected()) {
            connectWebSocket();
        }
    }, [handleTerminalClick, connectWebSocket]);

    return (
        <div className="desktop">
            <DesktopBackground />

            {/* Terminal Windows */}
            {terminalWindows.map((window) => (
                <TerminalWindow
                    key={window.id}
                    window={window}
                    activeWindow={activeWindow}
                    onMouseDown={handleMouseDown}
                    onClose={handleWindowClose}
                    onData={handleTerminalData}
                    onResize={handleTerminalResize}
                    onTerminalRef={setTerminalRef}
                />
            ))}

            {/* VSCode Windows */}
            {vscodeWindows.map((window) => (
                <VSCodeWindow
                    key={window.id}
                    window={window}
                    activeWindow={activeWindow}
                    onMouseDown={handleMouseDown}
                    onClose={handleVSCodeClose}
                />
            ))}

            {/* System Monitor Windows */}
            {systemMonitorWindows.map((window) => (
                <SystemMonitorWindow
                    key={window.id}
                    window={window}
                    activeWindow={activeWindow}
                    onMouseDown={handleMouseDown}
                    onClose={handleSystemMonitorClose}
                />
            ))}

            <Taskbar
                serverStatus={serverStatus}
                onTerminalClick={handleTerminalOpen}
                onVSCodeClick={handleVSCodeClick}
                onSystemMonitorClick={handleSystemMonitorClick}
            />
        </div>
    );
}
