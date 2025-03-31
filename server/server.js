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

app.use(express.json());

// Set up rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after an hour",
});

app.use("/api/youtube", apiLimiter);

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

app.use("/api/youtube", youtubeProxy);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
