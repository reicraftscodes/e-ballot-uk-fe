import axios, { AxiosError } from "axios";

// Spring Boot backend base URL
export const API_BASE_URL = "http://localhost:8080";

// Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add JWT token automatically, if one is ever set
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Shape returned by the backend's GlobalExceptionHandler
 * (see ApiResponse / ErrorDetailsResponse on the Spring Boot side).
 */
interface BackendApiResponse {
  title?: string;
  detail?: string;
  error?: {
    code?: string;
    details?: string;
  };
  timestamp?: string;
}

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// Normalise backend error payloads into a single, predictable ApiError
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BackendApiResponse>) => {
    const status = error.response?.status;
    const body = error.response?.data;

    const message =
      body?.error?.details ||
      body?.detail ||
      error.message ||
      "Something went wrong";

    return Promise.reject(new ApiError(message, status, body?.error?.code));
  },
);

// ---------------------------------------------------------------------------
// Domain types — these mirror the DTOs actually exposed by the backend.
// ---------------------------------------------------------------------------

/** Matches PartyListDto returned by GET /api/v1/uk/parties/all */
export interface PartyListDto {
  id: number;
  partyName: string;
  position: string;
}

/** Matches CastVoteRequestDto expected by POST /api/v1/voting/castVote */
export interface CastVoteRequestDto {
  nationalInsuranceNumber: string;
  lastName: string;
  partyId: number;
}

/** Matches VoteResponseDto returned by POST /api/v1/voting/castVote */
export interface VoteResponseDto {
  referenceNo: string;
  timestamp: string;
}

/** Matches PartyVoteResponse returned by GET /api/v1/voting/party/{partyId} */
export interface PartyVoteResponse {
  partyId: number;
  partyName: string;
  totalVotes: number;
}

// ---------------------------------------------------------------------------
// Voting API — one function per real backend endpoint.
// ---------------------------------------------------------------------------
export const votingService = {
  /** GET api/v1/uk/parties/all */
  getParties: () => api.get<PartyListDto[]>("/api/v1/uk/parties/all"),

  /** POST /api/v1/voting/castVote */
  castVote: (request: CastVoteRequestDto) =>
    api.post<VoteResponseDto>("/api/v1/voting/castVote", request),

  /** GET /api/v1/voting/count */
  getTotalVoteCount: () => api.get<number>("/api/v1/voting/count"),

  /** GET /api/v1/voting/party/{partyId} */
  getVotesByParty: (partyId: number) =>
    api.get<PartyVoteResponse>(`/api/v1/voting/party/${partyId}`),
};

export default api;
