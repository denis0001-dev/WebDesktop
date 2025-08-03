import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import * as pty from "@lydell/node-pty";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Global shell reference
let shell: pty.IPty | null = null;

function createShell() {
    if (shell) {
        shell.kill();
    }

    shell = pty.spawn(process.env.SHELL || "bash", [], {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        cwd: process.cwd(),
        env: process.env,
        handleFlowControl: true,
        flowControlPause: "0",
    });

    return shell;
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, "../dist")));

// API Routes
app.get("/api/status", (req, res) => {
    res.json({
        status: "online",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.get("/api/system", (req, res) => {
    res.json({
        platform: process.platform,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
    });
});

// WebSocket connection handling
wss.on("connection", (ws) => {
    // Create shell for this connection
    const clientShell = createShell();

    // Send welcome message
    ws.send(
        JSON.stringify({
            type: "connection",
            message: "Connected to WebDesktop TTY Server",
            timestamp: new Date().toISOString(),
        }),
    );

    // Handle TTY data
    clientShell.onData((data: string) => {
        ws.send(
            JSON.stringify({
                type: "tty_data",
                data: data,
            }),
        );
    });

    // Handle TTY exit
    clientShell.onExit(
        ({ exitCode, signal }: { exitCode: number; signal?: number }) => {
            ws.send(
                JSON.stringify({
                    type: "tty_exit",
                    exitCode,
                    signal: signal?.toString() || "unknown",
                }),
            );
        },
    );

    ws.on("message", (data) => {
        try {
            const message = JSON.parse(data.toString());
            handleWebSocketMessage(ws, message, clientShell);
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    });

    ws.on("close", () => {
        // Client disconnected
    });
});

interface WebSocketMessage {
    type: string;
    data?: string;
}

interface WebSocketWithSend {
    send: (data: string) => void;
}

function handleWebSocketMessage(
    ws: WebSocketWithSend,
    message: WebSocketMessage,
    clientShell: pty.IPty,
) {
    switch (message.type) {
        case "tty_input": {
            // Send input to the TTY
            if (message.data) {
                clientShell.write(message.data);
            }
            break;
        }

        case "tty_resize": {
            // Handle terminal resize
            const { cols, rows } = JSON.parse(message.data || "{}");
            if (cols && rows) {
                clientShell.resize(cols, rows);
            }
            break;
        }

        case "ping":
            ws.send(
                JSON.stringify({
                    type: "pong",
                    timestamp: new Date().toISOString(),
                }),
            );
            break;

        default:
        // Unknown message type
    }
}

// Catch-all route for SPA
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`🚀 WebDesktop TTY Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready for TTY connections`);
    console.log(`🌐 API available at http://localhost:${PORT}/api`);
    console.log(
        `🖥️  Desktop app will be available at http://localhost:${PORT}`,
    );
    console.log(`🐚 TTY shell: ${process.env.SHELL || "bash"}`);
});
