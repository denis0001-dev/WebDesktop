import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import * as pty from "@lydell/node-pty";
import { spawn, ChildProcess, exec } from "child_process";
import { createServer as createNetServer } from "net";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Global shell reference
let shell: pty.IPty | null = null;

// Global code-server reference
let codeServerProcess: ChildProcess | null = null;
let codeServerPort: number | null = null;

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

function startCodeServer(): Promise<{ url: string; port: number }> {
    return new Promise((resolve, reject) => {
        if (codeServerProcess) {
            // Code-server is already running
            resolve({ url: `http://localhost:${codeServerPort}`, port: codeServerPort! });
            return;
        }

        // Create settings directory and file for dark theme
        const settingsDir = path.join(__dirname, '../.vscode-server/User');
        const settingsFile = path.join(settingsDir, 'settings.json');
        
        try {
            // Ensure settings directory exists
            if (!existsSync(settingsDir)) {
                mkdirSync(settingsDir, { recursive: true });
            }
            
            // Create or update settings file with dark theme
            const settings = {
                "workbench.colorTheme": "Default Dark+",
                "workbench.preferredDarkColorTheme": "Default Dark+",
                "workbench.preferredLightColorTheme": "Default Dark+"
            };
            
            writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
        } catch (error) {
            console.warn('Could not create VSCode settings file:', error);
        }

        // Find an available port starting from 8080
        const findAvailablePort = (startPort: number): Promise<number> => {
            return new Promise((resolve) => {
                const server = createNetServer();
                server.listen(startPort, () => {
                    const address = server.address();
                    const port = typeof address === 'object' && address ? address.port : startPort;
                    server.close(() => resolve(port));
                });
                server.on('error', () => {
                    findAvailablePort(startPort + 1).then(resolve);
                });
            });
        };

        findAvailablePort(8080).then((port) => {
            codeServerPort = port;
            
            // Start code-server
            codeServerProcess = spawn('npx', ['code-server', 
                '--port', port.toString(),
                '--host', '0.0.0.0',
                '--auth', 'none',
                '--disable-telemetry',
                '--user-data-dir', path.join(__dirname, '../.vscode-server'),
                '--extensions-dir', path.join(__dirname, '../.vscode-extensions'),
                process.cwd() // Open current directory
            ], {
                stdio: 'pipe',
                env: { ...process.env, PWD: process.cwd() }
            });

            codeServerProcess.stdout?.on('data', (data: Buffer) => {
                console.log(`Code-server: ${data.toString()}`);
            });

            codeServerProcess.stderr?.on('data', (data: Buffer) => {
                console.log(`Code-server error: ${data.toString()}`);
            });

            codeServerProcess.on('error', (error: Error) => {
                console.error('Failed to start code-server:', error);
                reject(error);
            });

            codeServerProcess.on('exit', (code: number) => {
                if (code !== 0) {
                    console.error(`Code-server exited with code ${code}`);
                    reject(new Error(`Code-server exited with code ${code}`));
                }
            });

            // Wait a bit for code-server to start
            setTimeout(() => {
                resolve({ url: `http://localhost:${port}`, port });
            }, 2000);
        });
    });
}

function stopCodeServer() {
    if (codeServerProcess) {
        codeServerProcess.kill();
        codeServerProcess = null;
        codeServerPort = null;
    }
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

// VSCode API endpoint
app.post("/api/vscode/start", async (req, res) => {
    try {
        const { url, port } = await startCodeServer();
        res.json({ url, port });
    } catch (error) {
        console.error('Error starting VSCode:', error);
        res.status(500).json({ 
            error: 'Failed to start VSCode',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: 'Make sure code-server is installed: npm install code-server --save-dev'
        });
    }
});

app.post("/api/vscode/stop", (req, res) => {
    try {
        stopCodeServer();
        res.json({ message: 'VSCode stopped' });
    } catch (error) {
        console.error('Error stopping VSCode:', error);
        res.status(500).json({ error: 'Failed to stop VSCode' });
    }
});

// System stats endpoint
app.get("/api/system/stats", async (req, res) => {
    try {
        const stats = await getSystemStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting system stats:', error);
        res.status(500).json({ error: 'Failed to get system stats' });
    }
});

async function getSystemStats() {
    const cpuUsage = await getCPUUsage();
    const memoryInfo = getMemoryInfo();
    const diskInfo = await getDiskInfo();
    const networkInfo = await getNetworkInfo();
    const uptime = process.uptime();

    return {
        cpu: cpuUsage,
        memory: memoryInfo,
        disk: diskInfo,
        network: networkInfo,
        uptime: uptime,
    };
}

async function getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
        const startUsage = process.cpuUsage();
        setTimeout(() => {
            const endUsage = process.cpuUsage(startUsage);
            const totalUsage = endUsage.user + endUsage.system;
            const totalTime = totalUsage / 1000000; // Convert to seconds
            const cpuUsage = Math.min(100, Math.round(totalTime * 100));
            resolve(cpuUsage);
        }, 100);
    });
}

function getMemoryInfo() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
        total: totalMem,
        used: usedMem,
        free: freeMem,
    };
}

async function getDiskInfo() {
    return new Promise((resolve) => {
        exec('df / | tail -1', (error: Error | null, stdout: string) => {
            if (error) {
                resolve({ total: 0, used: 0, free: 0 });
                return;
            }
            
            const parts = stdout.trim().split(/\s+/);
            const total = parseInt(parts[1]) * 1024; // Convert KB to bytes
            const used = parseInt(parts[2]) * 1024;
            const free = parseInt(parts[3]) * 1024;
            
            resolve({ total, used, free });
        });
    });
}

async function getNetworkInfo() {
    return new Promise((resolve) => {
        exec('cat /proc/net/dev | grep -E "(eth0|en0|wlan0|wl0)" | head -1', (error: Error | null, stdout: string) => {
            if (error) {
                resolve({ rx: 0, tx: 0 });
                return;
            }
            
            const parts = stdout.trim().split(/\s+/);
            const rx = parseInt(parts[1]) || 0;
            const tx = parseInt(parts[9]) || 0;
            
            resolve({ rx, tx });
        });
    });
}

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
