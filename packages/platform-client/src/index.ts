// Client for the suite platform service (classes, seats, personas, scores).
// Game-agnostic: every game in the suite posts through this with its own
// gameId. Zero child PII — identity is an invented persona on an anonymous
// seat; the seat code is the scholar's credential.

export interface ClassInfo {
  code: string;
  name: string;
  teams: string[];
  seatsTotal: number;
  seatsFree: number;
}

export interface ClaimResult {
  ok: true;
  persona: string;
  avatar: string;
  team: string | null;
}

export interface BoardRow {
  persona: string;
  avatar: string | null;
  team: string | null;
  score: number;
  updatedAt: string;
}

export interface Board {
  seasonId: string;
  rows: BoardRow[];
}

export interface TeacherSeat {
  seatCode: string;
  persona: string | null;
  avatar: string | null;
  team: string | null;
  claimedAt: string | null;
}

export interface CreatedClass {
  code: string;
  teacherKey: string;
  name: string;
  teams: string[];
  seatCodes: string[];
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

  getClass(code: string): Promise<ClassInfo> {
    return request<ClassInfo>(this.baseUrl, `/api/classes/${encodeURIComponent(code)}`);
  }

  claimSeat(input: {
    classCode: string;
    seatCode: string;
    persona: string;
    avatar: string;
    team?: string | null;
  }): Promise<ClaimResult> {
    return request<ClaimResult>(this.baseUrl, `/api/personas/claim`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  /** Post a season score. Seat code authenticates; server keeps best-per-seat. */
  postScore(input: {
    classCode: string;
    seatCode: string;
    seasonId: string;
    score: number;
  }): Promise<{ ok: true }> {
    return request<{ ok: true }>(this.baseUrl, `/api/scores`, {
      method: "POST",
      body: JSON.stringify({ ...input, gameId: this.gameId }),
    });
  }

  getBoard(classCode: string, seasonId: string): Promise<Board> {
    return request<Board>(
      this.baseUrl,
      `/api/boards/${encodeURIComponent(classCode)}/${encodeURIComponent(this.gameId)}/${encodeURIComponent(seasonId)}`,
    );
  }

  // ---- Teacher surface -----------------------------------------------------

  createClass(input: { name: string; seats: number; teams?: string[] }): Promise<CreatedClass> {
    return request<CreatedClass>(this.baseUrl, `/api/teacher/classes`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  getSeats(classCode: string, teacherKey: string): Promise<{ code: string; seats: TeacherSeat[] }> {
    return request(this.baseUrl, `/api/teacher/classes/${encodeURIComponent(classCode)}/seats`, {
      headers: { "x-teacher-key": teacherKey },
    });
  }
}
