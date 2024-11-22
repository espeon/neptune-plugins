import { createServer, IncomingMessage, ServerResponse } from "http";
import { Tracer } from "@inrixia/lib/trace";

const trace = Tracer("[EddyAPI][Native]");
const port = 3000;

// Store the current media info
let currentMediaInfo: any = {};

// Update the media info
export const updateMediaInfo = (mediaInfo: any) => {
  currentMediaInfo = mediaInfo;
  trace.log("Media info updated:", currentMediaInfo);
};

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS request for CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle GET requests
  if (req.method === "GET") {
    if (req.url === "/now-playing") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(currentMediaInfo));
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

server.listen(port, () => {
  trace.log(`EddyAPI server is running on port ${port}`);
});

// Cleanup function
export const stopServer = () => {
  server.close(() => {
    trace.log("Server stopped");
  });
};
