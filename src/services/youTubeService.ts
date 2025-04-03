export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  // Additional fields from video details API
  viewCount?: string;
  likeCount?: string;
  locationDescription?: string;
  publishedAt?: string;
  description?: string;
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

interface YouTubeVideoDetailsResponse {
  items: Array<{
    id: string;
    snippet: {
      publishedAt: string;
      description: string;
    };
    statistics: {
      viewCount: string;
      likeCount: string;
    };
    recordingDetails?: {
      locationDescription?: string;
      location?: {
        latitude: number;
        longitude: number;
      };
    };
  }>;
}

class YouTubeService {
  private static instance: YouTubeService;
  private useFakeData: boolean;
  private proxyUrl: string;

  private constructor() {
    this.useFakeData = import.meta.env.VITE_USE_FAKE_DATA === "true";
    this.proxyUrl = import.meta.env.VITE_PROXY_URL || "/api/youtube";
    console.log("YouTubeService initialized with proxy URL:", this.proxyUrl);
  }

  public static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  /**
   * Get detailed information for a set of videos by their IDs
   * @param videoIds Array of YouTube video IDs
   * @returns Promise with detailed video information
   */
  public async getVideoDetails(
    videoIds: string[]
  ): Promise<YouTubeVideoDetailsResponse> {
    if (!videoIds.length) {
      return { items: [] };
    }

    // Determine which endpoint to use
    const endpoint = this.useFakeData
      ? `${this.proxyUrl}/fake/videos`
      : `${this.proxyUrl}/videos`;

    // Set up parameters
    const params = new URLSearchParams();
    params.append("part", "snippet,statistics,recordingDetails");
    params.append("id", videoIds.join(","));

    // Construct URL
    const url = `${endpoint}?${params.toString()}`;
    console.log("Fetching video details from:", url);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`YouTube Videos API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Retrieved ${data.items?.length || 0} video details`);

      return data;
    } catch (error) {
      console.error("Error fetching video details:", error);
      throw error;
    }
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

    // Set up parameters
    const params = new URLSearchParams();

    // Only add location parameters for real API calls
    if (!this.useFakeData) {
      params.append("part", "snippet");
      params.append("type", "video");
      params.append("order", "date");
      params.append("maxResults", "15");
      params.append("location", `${latitude}, ${longitude}`);
      params.append("locationRadius", "50km");
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

    console.log("Fetching videos by location from:", url);

    try {
      // Step 1: Get the search results
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = (await response.json()) as YouTubeSearchResponse;
      console.log(`Retrieved ${data.items?.length || 0} videos from search`);

      // Step 2: Get the basic video information
      const basicVideos = data.items.map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium?.url || "",
      }));

      // Step 3: Extract the video IDs
      const videoIds = basicVideos.map((video) => video.id);

      if (videoIds.length === 0) {
        return {
          videos: [],
          nextPageToken: data.nextPageToken,
        };
      }

      // Step 4: Get video details
      const detailsResponse = await this.getVideoDetails(videoIds);

      // Step 5: Combine the search results with the video details
      const videos = basicVideos.map((basicVideo) => {
        const detailItem = detailsResponse.items?.find(
          (item) => item.id === basicVideo.id
        );

        if (detailItem) {
          return {
            ...basicVideo,
            viewCount: detailItem.statistics?.viewCount,
            likeCount: detailItem.statistics?.likeCount,
            publishedAt: detailItem.snippet?.publishedAt,
            description: detailItem.snippet?.description,
            locationDescription:
              detailItem.recordingDetails?.locationDescription,
          };
        }

        return basicVideo;
      });

      // Log videos
      if (videos.length > 0) {
        console.log("Videos with details:", videos);
      }

      return {
        videos,
        nextPageToken: data.nextPageToken,
      };
    } catch (error) {
      console.error("Error in getVideosByLocation:", error);
      throw error;
    }
  }
}

export default YouTubeService;
