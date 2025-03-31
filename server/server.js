import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit from "express-rate-limit";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  console.error(
    "YouTube API key is required. Set YOUTUBE_API_KEY in your .env file."
  );
  process.exit(1);
}

// Enable CORS for your front-end application
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON request bodies
app.use(express.json());

// Set up rate limiting
// Using a much higher limit for development
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // increased limit for development
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Rate limit exceeded from proxy server. Please try again later.",
});

// Apply rate limiting to all YouTube API requests
app.use("/api/youtube", apiLimiter);

// Create a proxy middleware for YouTube API requests
const youtubeProxy = createProxyMiddleware({
  target: "https://www.googleapis.com/youtube/v3",
  changeOrigin: true,
  pathRewrite: {
    "^/api/youtube": "", // Remove the /api/youtube prefix
  },
  onProxyReq: (proxyReq) => {
    // Add the API key to all requests
    const url = new URL(proxyReq.path, "https://www.googleapis.com");
    url.searchParams.append("key", YOUTUBE_API_KEY);
    proxyReq.path = url.pathname + url.search;
  },
  logLevel: "error",
});

// Use the proxy middleware for YouTube API endpoints
app.use("/api/youtube", youtubeProxy);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
