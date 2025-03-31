// This service handles interactions with the YouTube API
// through our proxy server for API key protection and rate limiting

interface YouTubeApiConfig {
  proxyUrl?: string;
}

// Define YouTube API response types
export interface YouTubeSearchResponse {
  items: Array<{
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      thumbnails: {
        default: { url: string; width: number; height: number };
        medium: { url: string; width: number; height: number };
        high: { url: string; width: number; height: number };
      };
    };
  }>;
  nextPageToken?: string;
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface YouTubeVideoDetailsResponse {
  items: Array<{
    id: string;
    statistics: {
      viewCount: string;
      likeCount: string;
      commentCount: string;
    };
    contentDetails: {
      duration: string;
    };
    recordingDetails?: {
      locationDescription?: string;
      location?: {
        latitude: number;
        longitude: number;
        altitude: number;
      };
    };
  }>;
}

class YouTubeService {
  private static instance: YouTubeService;
  private proxyUrl: string;

  private constructor(config: YouTubeApiConfig) {
    this.proxyUrl = config.proxyUrl || "http://localhost:3001/api/youtube";
  }

  public static getInstance(config?: YouTubeApiConfig): YouTubeService {
    if (!YouTubeService.instance && config) {
      YouTubeService.instance = new YouTubeService(config);
    }
    return YouTubeService.instance;
  }

  /**
   * Search for videos based on geographic coordinates
   */
  public async searchVideos(
    latitude: number,
    longitude: number,
    pageToken?: string
  ): Promise<YouTubeSearchResponse> {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      order: "date",
      maxResults: "5",
      location: `${latitude}, ${longitude}`,
      locationRadius: "100km",
      videoEmbeddable: "true",
      safeSearch: "none",
    });

    if (pageToken) {
      params.append("pageToken", pageToken);
    }

    try {
      const response = await fetch(
        `${this.proxyUrl}/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          `YouTube API error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching videos:", error);
      throw error;
    }
  }

  /**
   * Get detailed information about specific videos
   */
  public async getVideoDetails(
    videoIds: string[]
  ): Promise<YouTubeVideoDetailsResponse> {
    const params = new URLSearchParams({
      part: "contentDetails,statistics,status,recordingDetails",
      id: videoIds.join(","),
    });

    try {
      const response = await fetch(
        `${this.proxyUrl}/videos?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          `YouTube API error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting video details:", error);
      throw error;
    }
  }
}

export default YouTubeService;
