import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import mockResponse from "./mockYouTubeResponse.js";

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

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const youtubeApiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// YouTube API proxy endpoint with rate limiting
app.get("/api/youtube/search", youtubeApiLimiter, async (req, res) => {
  try {
    console.log("Received YouTube API request:", req.query);

    const queryParams = new URLSearchParams(req.query);

    queryParams.append("key", YOUTUBE_API_KEY);

    // Log the request (without showing the full API key)
    const apiKeyPrefix = YOUTUBE_API_KEY.substring(0, 4);
    console.log(`Making request to YouTube API with key: ${apiKeyPrefix}...`);

    // Make the request to YouTube API
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${queryParams.toString()}`
    );

    if (!response.ok) {
      console.error("YouTube API error:", response.status);
      return res.status(response.status).json({
        error: "YouTube API error",
        status: response.status,
      });
    }

    const data = await response.json();
    console.log(
      `Successfully retrieved ${
        data.items?.length || 0
      } results from YouTube API`
    );

    res.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy server error" });
  }
});

// Fake data endpoint - returns the mock response
app.get("/api/youtube/fake/search", (req, res) => {
  console.log("Serving fake YouTube data");

  // Add a slight delay
  setTimeout(() => {
    res.json(mockResponse);
  }, 200);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
