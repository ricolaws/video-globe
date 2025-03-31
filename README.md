# Video Globe App

An interactive 3D globe application that allows users to discover videos based on geographic locations. Click anywhere on the globe to find videos uploaded from that specific location.

## Features

- Interactive 3D globe powered by Three.js and React Three Fiber
- Location-based video discovery using YouTube's API
- API quota management through a proxy server
- Rate limiting to stay within YouTube API limits
- Responsive design for various screen sizes

## Project Structure

```
video-globe/
├── src/
│   ├── assets/            # Static assets like textures, images
│   ├── components/        # React components
│   │   ├── Globe.tsx      # 3D globe component
│   │   ├── VideoPlayer.tsx
│   │   └── VideoController.tsx
│   ├── hooks/             # Custom React hooks
│   │   └── useYouTubeAPI.ts
│   ├── services/          # API and other services
│   │   └── youTubeService.ts
│   ├── App.tsx            # Main application component
│   ├── config.ts          # Configuration file
│   └── main.tsx           # Entry point
├── server/                # Proxy server for YouTube API
│   └── server.ts
├── .env                   # Environment variables
└── package.json           # Dependencies and scripts
```

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- YouTube Data API v3 key

### Installation

1. Clone the repository

   ```
   git clone <repository-url>
   cd video-globe
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following:

   ```
   VITE_YOUTUBE_API_KEY=your_youtube_api_key
   VITE_YOUTUBE_PROXY_URL=http://localhost:3001/api/youtube
   ```

4. Create a `.env` file in the server directory with the following:
   ```
   YOUTUBE_API_KEY=your_youtube_api_key
   PORT=3001
   CLIENT_URL=http://localhost:5173
   ```

### Running the application

1. Start the proxy server

   ```
   cd server
   npm start
   ```

2. In another terminal, start the frontend application

   ```
   npm run dev
   ```

3. Open the application in your browser at `http://localhost:5173`

## Usage

1. Wait for the 3D globe to load
2. Double-click on any location on the globe
3. The application will fetch videos from that geographic location
4. Videos will be displayed in a modal that allows you to navigate through the results

## Deployment

### Frontend Deployment

The application can be deployed to Vercel, Netlify, or Firebase Hosting:

```
npm run build
```

Then follow the hosting provider's instructions for deploying the `dist` directory.

### Proxy Server Deployment

The proxy server can be deployed to Heroku, Railway, or any other Node.js hosting platform.

Make sure to update the `VITE_YOUTUBE_PROXY_URL` in your frontend environment to point to the deployed server URL.

## Credits

- Globe textures from [NASA Visible Earth](https://visibleearth.nasa.gov/)
- Built with React, TypeScript, Three.js, and React Three Fiber
