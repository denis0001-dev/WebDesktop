import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

interface TerminalProps {
    onData: (data: string) => void;
    onResize: (cols: number, rows: number) => void;
    isConnected: boolean;
    onRef?: (ref: { writeData: (data: string) => void } | null) => void;
}

export default function TerminalComponent({
    onData,
    onResize,
    isConnected,
    onRef,
}: TerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminalInstance = useRef<Terminal | null>(null);
    const fitAddon = useRef<FitAddon | null>(null);
    
    // Use refs to access latest callback values
    const onDataRef = useRef(onData);
    const onResizeRef = useRef(onResize);
    const isConnectedRef = useRef(isConnected);
    
    // Update refs when props change
    useEffect(() => {
        onDataRef.current = onData;
        onResizeRef.current = onResize;
        isConnectedRef.current = isConnected;
    }, [onData, onResize, isConnected]);

    useEffect(() => {
        if (!terminalRef.current) {
            return;
        }

        if (terminalInstance.current) {
            return;
        }
        // Create terminal instance
        const terminal = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily:
                "SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace",
            theme: {
                background: "#1e1e1e",
                foreground: "#d4d4d4",
                cursor: "#ffffff",
                black: "#000000",
                red: "#cd3131",
                green: "#0dbc79",
                yellow: "#e5e510",
                blue: "#2472c8",
                magenta: "#bc3fbc",
                cyan: "#11a8cd",
                white: "#e5e5e5",
                brightBlack: "#666666",
                brightRed: "#f14c4c",
                brightGreen: "#23d18b",
                brightYellow: "#f5f543",
                brightBlue: "#3b8eea",
                brightMagenta: "#d670d6",
                brightCyan: "#29b8db",
                brightWhite: "#ffffff",
            },
            cols: 80,
            rows: 30,
        });

        // Create addons
        const fitAddonInstance = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        // Load addons
        terminal.loadAddon(fitAddonInstance);
        terminal.loadAddon(webLinksAddon);

        // Open terminal
        terminal.open(terminalRef.current);

        // Store references
        terminalInstance.current = terminal;
        fitAddon.current = fitAddonInstance;

        // Fit to container after a brief delay to ensure DOM is ready
        setTimeout(() => {
            if (fitAddonInstance) {
                fitAddonInstance.fit();
            }
        }, 0);

        // Handle terminal data
        terminal.onData((data) => {
            // Only send data if we're connected
            if (isConnectedRef.current) {
                onDataRef.current(data);
            }
        });

        // Handle terminal resize
        terminal.onResize(({ cols, rows }) => {
            onResizeRef.current(cols, rows);
        });

        // Handle window resize
        const handleResize = () => {
            if (fitAddon.current && terminalRef.current) {
                try {
                    fitAddon.current.fit();
                } catch (error) {
                    console.warn("Terminal resize failed:", error);
                }
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            if (terminal) {
                terminal.dispose();
            }
            terminalInstance.current = null;
            fitAddon.current = null;
        };
    }, []); // Empty dependency array - terminal is created only once

    // Handle incoming data from WebSocket
    useEffect(() => {
        if (terminalInstance.current && isConnected) {
            // Write welcome message
            terminalInstance.current.write(
                "\r\n\x1b[32m✅ Connected to WebDesktop TTY Server\x1b[0m\r\n",
            );
            terminalInstance.current.write(
                "\x1b[36mReady to execute system commands.\x1b[0m\r\n\r\n",
            );
        }
    }, [isConnected]);

    // Expose write method to parent
    useEffect(() => {
        if (terminalInstance.current) {
            const terminalWithWriteData = {
                writeData: (data: string) => {
                    if (terminalInstance.current) {
                        terminalInstance.current.write(data);
                    }
                },
            };
            if (onRef) {
                onRef(terminalWithWriteData);
            }
        }
    }, [onRef]);

    // Handle container resize
    useEffect(() => {
        if (!terminalRef.current || !fitAddon.current) return;

        const resizeObserver = new ResizeObserver(() => {
            if (fitAddon.current && terminalRef.current) {
                try {
                    fitAddon.current.fit();
                    // Get the new dimensions and notify parent
                    if (terminalInstance.current) {
                        const cols = terminalInstance.current.cols;
                        const rows = terminalInstance.current.rows;
                        onResizeRef.current(cols, rows);
                    }
                } catch (error) {
                    console.warn("Terminal resize failed:", error);
                }
            }
        });

        resizeObserver.observe(terminalRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []); // Empty dependency array - observer is created only once

    return (
        <div
            ref={terminalRef}
            className="terminal-container"
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#1e1e1e",
            }}
        />
    );
}
