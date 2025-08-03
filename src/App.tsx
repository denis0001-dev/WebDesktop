import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import TerminalComponent from "./components/Terminal";

interface WindowPosition {
    x: number;
    y: number;
}

interface TerminalWindow {
    id: string;
    isOpen: boolean;
    position: WindowPosition;
    connected: boolean;
    width: number;
    height: number;
}

export default function App() {
    const [terminalWindows, setTerminalWindows] = useState<TerminalWindow[]>([
        {
            id: "1",
            isOpen: false,
            position: { x: 100, y: 100 },
            connected: false,
            width: 800,
            height: 600,
        },
    ]);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [serverStatus, setServerStatus] = useState<
        "connecting" | "connected" | "disconnected"
    >("disconnected");
    const [activeWindow, setActiveWindow] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const terminalRefs = useRef<{
        [key: string]: { writeData: (data: string) => void } | null;
    }>({});
    const [windowInitialized, setWindowInitialized] = useState<{ [key: string]: boolean }>({});

    const handleTerminalClick = () => {
        setTerminalWindows((prev) =>
            prev.map((window) =>
                window.id === "1" ? { ...window, isOpen: true } : window,
            ),
        );

        // Reset initialization flag for this window
        setWindowInitialized(prev => ({ ...prev, "1": false }));

        // Connect WebSocket when terminal is opened
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            connectWebSocket();
        }
    };

    const handleWindowClose = (windowId: string) => {
        setTerminalWindows((prev) =>
            prev.map((window) =>
                window.id === windowId ? { ...window, isOpen: false } : window,
            ),
        );
    };

    const handleMouseDown = (e: React.MouseEvent, windowId: string) => {
        e.preventDefault();
        setActiveWindow(windowId);
        setIsDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (isDragging && activeWindow) {
                setTerminalWindows((prev) =>
                    prev.map((window) =>
                        window.id === activeWindow
                            ? {
                                  ...window,
                                  position: {
                                      x: e.clientX - dragOffset.x,
                                      y: e.clientY - dragOffset.y,
                                  },
                              }
                            : window,
                    ),
                );
            }
        },
        [isDragging, activeWindow, dragOffset],
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setActiveWindow(null);
    }, []);

    // WebSocket connection function
    const connectWebSocket = () => {
        const websocket = new WebSocket("ws://localhost:3001");

        websocket.onopen = () => {
            setServerStatus("connected");
            setWs(websocket);
            setTerminalWindows((prev) =>
                prev.map((window) => ({ ...window, connected: true })),
            );
        };

        websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "tty_data") {
                    // Write data to the active terminal
                    const activeTerminal =
                        terminalRefs.current[activeWindow || "1"];
                    if (activeTerminal && activeTerminal.writeData) {
                        activeTerminal.writeData(data.data);
                    } else {
                        // Try to write to any available terminal
                        const anyTerminal = Object.values(
                            terminalRefs.current,
                        ).find((ref) => ref && ref.writeData);
                        if (anyTerminal) {
                            anyTerminal.writeData(data.data);
                        }
                    }
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        };

        websocket.onclose = () => {
            setServerStatus("disconnected");
            setWs(null);
            setTerminalWindows((prev) =>
                prev.map((window) => ({ ...window, connected: false })),
            );
        };

        websocket.onerror = () => {
            setServerStatus("disconnected");
        };
    };

    const handleTerminalData = useCallback(
        (data: string) => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                const message = JSON.stringify({
                    type: "tty_input",
                    data: data,
                });
                ws.send(message);
            } else {
                // Try to reconnect if not connected
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    connectWebSocket();
                }
            }
        },
        [ws],
    );

    const handleTerminalResize = useCallback(
        (cols: number, rows: number) => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(
                    JSON.stringify({
                        type: "tty_resize",
                        data: JSON.stringify({ cols, rows }),
                    }),
                );
            }
        },
        [ws],
    );

    const setTerminalRef = (
        windowId: string,
        ref: { writeData: (data: string) => void } | null,
    ) => {
        terminalRefs.current[windowId] = ref;
    };

    const handleWindowResize = (windowId: string, newWidth: number, newHeight: number) => {
        setTerminalWindows((prev) =>
            prev.map((window) =>
                window.id === windowId
                    ? { ...window, width: newWidth, height: newHeight }
                    : window,
            ),
        );
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, activeWindow, dragOffset, handleMouseMove, handleMouseUp]);

    // Handle window resizing
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
                            
                            // Skip if window hasn't been initialized yet
                            if (!windowInitialized[window.id]) {
                                setWindowInitialized(prev => ({ ...prev, [window.id]: true }));
                                return;
                            }
                            
                            // Only resize if the dimensions are significantly different
                            if (Math.abs(width - window.width) > 10 || Math.abs(height - window.height) > 10) {
                                handleWindowResize(window.id, width, height);
                            }
                        }
                    });
                    
                    // Start observing immediately but skip first resize
                    resizeObserver.observe(windowElement);
                    resizeObservers.push(resizeObserver);
                }
            }
        });

        return () => {
            resizeObservers.forEach((observer) => observer.disconnect());
        };
    }, [terminalWindows, windowInitialized]);

    return (
        <div className="desktop">
            {/* Desktop Background */}
            <div className="desktop-background">
                <div className="desktop-content">
                    <h1>WebDesktop</h1>
                    <p>Welcome to your modern desktop environment</p>
                </div>
            </div>

            {/* Terminal Windows */}
            {terminalWindows.map(
                (window) =>
                    window.isOpen && (
                        <div
                            key={window.id}
                            className="terminal-window"
                            data-window-id={window.id}
                            style={{
                                left: window.position.x,
                                top: window.position.y,
                                width: window.width,
                                height: window.height,
                                zIndex: activeWindow === window.id ? 1000 : 1,
                            }}
                            onMouseDown={(e) => {
                                // Only handle drag if not clicking on resize handle
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const y = e.clientY - rect.top;
                                const isResizeHandle = x > rect.width - 20 && y > rect.height - 20;
                                
                                if (!isResizeHandle) {
                                    handleMouseDown(e, window.id);
                                }
                            }}
                        >
                            <div
                                className="window-header"
                                onMouseDown={(e) =>
                                    handleMouseDown(e, window.id)
                                }
                            >
                                <div className="window-title">Terminal</div>
                                <div className="window-controls">
                                    <button
                                        className="window-close"
                                        onClick={() =>
                                            handleWindowClose(window.id)
                                        }
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                            <div className="terminal-content">
                                <TerminalComponent
                                    onData={handleTerminalData}
                                    onResize={handleTerminalResize}
                                    isConnected={window.connected}
                                    onRef={(ref) =>
                                        setTerminalRef(window.id, ref)
                                    }
                                />
                            </div>
                        </div>
                    ),
            )}

            {/* Taskbar */}
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
                        onClick={handleTerminalClick}
                        title="Terminal"
                    >
                        <span className="terminal-icon">⌨</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
