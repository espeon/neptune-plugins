import { createServer, IncomingMessage, ServerResponse } from "http";

interface ServerConfig {
  port: number;
  secure: boolean;
  apiKey?: string;
}

let server: ReturnType<typeof createServer>;
let currentMediaInfo: any = {};

// Update the media info
export const updateMediaInfo = (mediaInfo: any) => {
  currentMediaInfo = mediaInfo;
  console.log("Media info updated:", currentMediaInfo);
};

const createAPIServer = (config: ServerConfig) => {
  server = createServer((req: IncomingMessage, res: ServerResponse) => {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    // Handle OPTIONS request for CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Check API key if secure mode is enabled
    if (config.secure) {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${config.apiKey}`) {
        res.writeHead(401, { "Content-Type": "text/plain" });
        res.end("Unauthorized");
        return;
      }
    }

    // Handle GET requests
    if (req.method === "GET") {
      if (req.url === "/now-playing") {
        res.writeHead(200, { "Content-Type": "application/json" });
        let info = currentMediaInfo;
        info.currentTime = Date.now();
        if (!info.paused) {
          info.lastUpdatedPosition = info.position;
          info.offset = (info.currentTime - info.lastUpdate) / 1000;
          info.position = info.position + info.offset;
          info.serverCurrentTime = info.currentTime;
          info.serverLastUpdate = info.lastUpdate;
        }
        res.end(JSON.stringify(currentMediaInfo));
        // if lastupdatedposition, set back
        // todo: wack? lol. need to fix
        if (info.lastUpdatedPosition) {
          info.position = info.lastUpdatedPosition;
        }
        return;
      }

      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
        return;
      }
    }

    // Handle all other requests
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });

  server.listen(config.port, () => {
    console.log(
      `Server is running on port ${config.port}${config.secure ? " (secure mode)" : ""}`,
    );
  });

  return server;
};

export const startServer = (config: ServerConfig) => {
  if (server) {
    stopServer();
  }
  return createAPIServer(config);
};

// Cleanup function
export const stopServer = () => {
  if (server) {
    server.close(() => {
      console.log("Server stopped");
    });
  }
};
