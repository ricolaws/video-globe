export interface Video {
  id: string;
  title: string;
  thumbnail: string;
}

interface YouTubeSearchResponse {
  items: Array<{
    id: {
      kind: string;
      videoId: string;
    };
    snippet: {
      title: string;
      thumbnails: {
        medium?: {
          url: string;
        };
      };
    };
  }>;
  nextPageToken?: string;
}

class YouTubeService {
  private static instance: YouTubeService;
  private useFakeData: boolean;
  private proxyUrl: string;

  private constructor() {
    this.useFakeData = import.meta.env.VITE_USE_FAKE_DATA === "true";
    this.proxyUrl = import.meta.env.VITE_PROXY_URL || "";
  }

  public static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  public async getVideosByLocation(
    latitude: number,
    longitude: number,
    pageToken?: string
  ): Promise<{ videos: Video[]; nextPageToken?: string }> {
    // Determine which endpoint to use
    const endpoint = this.useFakeData
      ? `${this.proxyUrl}/fake/search`
      : `${this.proxyUrl}/search`;

    console.log(
      `Using ${
        this.useFakeData ? "fake" : "real"
      } data for location: ${latitude}, ${longitude}`
    );

    // Set up parameters
    const params = new URLSearchParams();

    // Only add location parameters for real API calls
    if (!this.useFakeData) {
      params.append("part", "snippet");
      params.append("type", "video");
      params.append("maxResults", "15");
      params.append("location", `${latitude}, ${longitude}`);
      params.append("locationRadius", "100km");
      params.append("videoEmbeddable", "true");

      if (pageToken) {
        params.append("pageToken", pageToken);
      }
    }

    if (this.useFakeData && pageToken) {
      params.append("pageToken", pageToken);
    }

    // Construct URL
    const url = params.toString()
      ? `${endpoint}?${params.toString()}`
      : endpoint;

    // Make the request
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = (await response.json()) as YouTubeSearchResponse;

    const videos = data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url || "",
    }));

    return {
      videos,
      nextPageToken: data.nextPageToken,
    };
  }
}

export default YouTubeService;
