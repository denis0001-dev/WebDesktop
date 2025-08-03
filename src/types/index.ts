export interface WindowPosition {
    x: number;
    y: number;
}

export interface TerminalWindow {
    id: string;
    isOpen: boolean;
    position: WindowPosition;
    connected: boolean;
    width: number;
    height: number;
}

export interface VSCodeWindow {
    id: string;
    isOpen: boolean;
    position: WindowPosition;
    width: number;
    height: number;
    loading: boolean;
    url: string | null;
}

export type ServerStatus = "connecting" | "connected" | "disconnected";

export interface TerminalRef {
    writeData: (data: string) => void;
}

export interface WindowDragState {
    isDragging: boolean;
    activeWindow: string | null;
    dragOffset: { x: number; y: number };
} 