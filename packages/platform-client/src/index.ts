// Client for the suite platform service (classes, rosters, seasons, scores).
// Game-agnostic: every game in the suite posts through this with its own gameId.

export interface RosterEntry {
  /** Display name only — e.g. "Maya R.". Never a full name. */
  name: string;
  /** Team/room within the class (e.g. "Hamilton"). Optional. */
  team: string | null;
}

export interface ClassInfo {
  code: string;
  name: string;
  roster: RosterEntry[];
}

export interface ScorePost {
  gameId: string;
  classCode: string;
  seasonId: string;
  playerName: string;
  score: number;
  detail?: Record<string, number>;
}

export interface BoardRow {
  playerName: string;
  team: string | null;
  score: number;
  updatedAt: string;
}

export interface Board {
  seasonId: string;
  rows: BoardRow[];
}

export class PlatformError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "PlatformError";
  }
}

async function request<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new PlatformError(res.status, body || res.statusText);
  }
  return (await res.json()) as T;
}

export class PlatformClient {
  constructor(
    private baseUrl: string,
    private gameId: string,
  ) {}

  /** Look up a class by its join code (scholar flow). */
  getClass(code: string): Promise<ClassInfo> {
    return request<ClassInfo>(this.baseUrl, `/api/classes/${encodeURIComponent(code)}`);
  }

  /** Post a season score. Server keeps best-per-player. */
  postScore(post: Omit<ScorePost, "gameId">): Promise<{ ok: true }> {
    return request<{ ok: true }>(this.baseUrl, `/api/scores`, {
      method: "POST",
      body: JSON.stringify({ ...post, gameId: this.gameId }),
    });
  }

  getBoard(classCode: string, seasonId: string): Promise<Board> {
    return request<Board>(
      this.baseUrl,
      `/api/boards/${encodeURIComponent(classCode)}/${encodeURIComponent(this.gameId)}/${encodeURIComponent(seasonId)}`,
    );
  }
}
