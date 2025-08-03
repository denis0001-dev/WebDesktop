import type { TerminalRef } from '../types';

export class WebSocketService {
    private ws: WebSocket | null = null;
    private onStatusChange: (status: "connecting" | "connected" | "disconnected") => void;
    private onTerminalData: (data: string) => void;
    private onConnectionUpdate: (connected: boolean) => void;
    private terminalRefs: { [key: string]: TerminalRef | null } = {};

    constructor(
        onStatusChange: (status: "connecting" | "connected" | "disconnected") => void,
        onTerminalData: (data: string) => void,
        onConnectionUpdate: (connected: boolean) => void
    ) {
        this.onStatusChange = onStatusChange;
        this.onTerminalData = onTerminalData;
        this.onConnectionUpdate = onConnectionUpdate;
    }

    connect(): void {
        this.ws = new WebSocket("ws://localhost:3001");

        this.ws.onopen = () => {
            this.onStatusChange("connected");
            this.onConnectionUpdate(true);
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "tty_data") {
                    this.onTerminalData(data.data);
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        };

        this.ws.onclose = () => {
            this.onStatusChange("disconnected");
            this.onConnectionUpdate(false);
        };

        this.ws.onerror = () => {
            this.onStatusChange("disconnected");
            this.onConnectionUpdate(false);
        };
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    send(data: string): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        }
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    setTerminalRef(windowId: string, ref: TerminalRef | null): void {
        this.terminalRefs[windowId] = ref;
    }

    writeToTerminal(windowId: string, data: string): void {
        const terminal = this.terminalRefs[windowId];
        if (terminal?.writeData) {
            terminal.writeData(data);
        }
    }

    writeToActiveTerminal(activeWindow: string | null, data: string): void {
        if (activeWindow) {
            this.writeToTerminal(activeWindow, data);
        } else {
            // Write to all available terminals
            Object.values(this.terminalRefs).forEach(terminal => {
                if (terminal?.writeData) {
                    terminal.writeData(data);
                }
            });
        }
    }
} 