import { createServer, IncomingMessage, ServerResponse } from "http";

import https from "https";

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

let frontendCache: Record<string, string> = {};

/// Cache the frontend files (index.html, index-*.js, index-*.css) in memory
const cacheFrontend = (callback: {
  (error: any): void;
  (arg0: Error | null): void;
}) => {
  const baseUrl = "eddyviewer.pages.dev";

  // Helper function to make HTTPS requests
  const makeRequest = (path, cb) => {
    const options = {
      hostname: baseUrl,
      path: path,
      method: "GET",
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        cb(null, data);
      });
    });

    req.on("error", (error) => {
      cb(error);
    });

    req.end();
  };

  // Fetch index.html
  makeRequest("/", (error, indexHtmlText) => {
    if (error) {
      console.error("Error fetching index.html:", error);
      return callback(error);
    }

    const scriptRegex =
      /<script type="module" crossorigin src="([^"]+)"><\/script>/g;
    const cssRegex = /<link rel="stylesheet" crossorigin href="([^"]+)">/g;
    const scriptMatches = scriptRegex.exec(indexHtmlText);
    const cssMatches = cssRegex.exec(indexHtmlText);

    if (!scriptMatches || !cssMatches) {
      return callback(new Error("Could not find script or CSS matches:"));
    }

    const scriptUrl = scriptMatches[1];
    const cssUrl = cssMatches[1];

    let completed = 0;
    let hasError = false;

    // cache html as 'index.html'
    frontendCache["/index.html"] = indexHtmlText;

    const checkComplete = () => {
      completed++;
      if (completed === 2 && !hasError) {
        callback(null);
      }
    };

    // Fetch script
    makeRequest(scriptUrl, (error, scriptText) => {
      if (error) {
        hasError = true;
        return callback(error);
      }
      frontendCache[scriptUrl] = scriptText;
      checkComplete();
    });

    // Fetch CSS
    makeRequest(cssUrl, (error, cssText) => {
      if (error) {
        hasError = true;
        return callback(error);
      }
      frontendCache[cssUrl] = cssText;
      checkComplete();
    });
  });
};

const getFrontendData = (url: string) => {
  return frontendCache[url];
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
      } else if (typeof req.url === "string") {
        // check if the url is a frontend asset
        if (req.url === "/") req.url = "/index.html";
        const frontendData = getFrontendData(req.url as string);
        let contentType = "text/html";
        if (req.url.endsWith(".css")) contentType = "text/css";
        if (req.url.endsWith(".js")) contentType = "text/javascript";
        if (frontendData) {
          res.writeHead(200, { "Content-Type": contentType });
          res.end(frontendData);
          return;
        }
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
  cacheFrontend((error: any) => {
    if (error) {
      console.error("Cache frontend failed:", error);
      throw error;
    }
    createAPIServer(config);
  });
};

// Cleanup function
export const stopServer = () => {
  if (server) {
    server.close(() => {
      console.log("Server stopped");
    });
  }
};
