export type IntegrationProvider =
  | "spotify"
  | "steam"
  | "github"
  | "strava"
  | "goodreads";

export interface Integration {
  userId: string;
  provider: IntegrationProvider;
  connectedAt: Date;
}

export interface IntegrationWithTokens extends Integration {
  accessToken: string | null;
  refreshToken: string | null;
}

export interface SpotifyActivity {
  trackName: string;
  artistName: string;
  albumArt: string;
}

export interface SteamActivity {
  gameName: string;
  gameId: string;
}
