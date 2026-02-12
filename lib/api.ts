import axios from 'axios';
import { JobPosting, JobPostingParseRequest, JobPostingParseResponse, JobPostingCreate } from '@/types/job';
import { Application, ApplicationStatus, ApplicationUpdate } from '@/types/application';
import { getAuthToken, parseBearerToken, removeAuthToken, setAuthToken } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const OAUTH_START_PATH =
  process.env.NEXT_PUBLIC_OAUTH_START_PATH || '/api/oauth2/authorization/cognito';

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set. Define it in .env.local');
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const headerValue = response.headers?.authorization ?? response.headers?.Authorization;
    const token = parseBearerToken(headerValue);
    if (token) {
      setAuthToken(token);
    }
    return response;
  },
  (error) => {
    if (error?.response?.status === 401) {
      removeAuthToken();
    }
    return Promise.reject(error);
  }
);

const normalizeStatus = (status: string): ApplicationStatus => {
  const upper = status?.toUpperCase?.() ?? status;
  switch (upper) {
    case ApplicationStatus.NOT_APPLIED:
      return ApplicationStatus.NOT_APPLIED;
    case ApplicationStatus.APPLIED:
      return ApplicationStatus.APPLIED;
    case ApplicationStatus.IN_PROGRESS:
      return ApplicationStatus.IN_PROGRESS;
    case ApplicationStatus.REJECTED:
      return ApplicationStatus.REJECTED;
    case ApplicationStatus.ACCEPTED:
      return ApplicationStatus.ACCEPTED;
    default:
      return ApplicationStatus.NOT_APPLIED;
  }
};

const normalizeApplication = (app: Application): Application => ({
  ...app,
  status: normalizeStatus(app.status as unknown as string),
});

// Jobs API
export const jobsApi = {
  parse: async (url: string): Promise<JobPostingParseResponse> => {
    const response = await apiClient.post<JobPostingParseResponse>('/jobs/parse', { url });
    return response.data;
  },

  create: async (jobData: JobPostingCreate): Promise<JobPosting> => {
    const response = await apiClient.post<JobPosting>('/jobs', jobData);
    return response.data;
  },

  getById: async (id: number): Promise<JobPosting> => {
    const response = await apiClient.get<JobPosting>(`/jobs/${id}`);
    return response.data;
  },
};

// Applications API
export const applicationsApi = {
  getAll: async (): Promise<Application[]> => {
    const response = await apiClient.get<Application[]>('/applications');
    return response.data.map(normalizeApplication);
  },

  getById: async (id: number): Promise<Application> => {
    const response = await apiClient.get<Application>(`/applications/${id}`);
    return normalizeApplication(response.data);
  },

  updateStatus: async (id: number, updateData: ApplicationUpdate): Promise<Application> => {
    const response = await apiClient.patch<Application>(`/applications/${id}/status`, updateData);
    console.log('updateStatus response:', response.data);
    return normalizeApplication(response.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/applications/${id}`);
  },
};

// Auth (start via BE OAuth2 to ensure session cookie is set)

export const authApi = {
  getLoginUrl: (): string => OAUTH_START_PATH,
  fetchAccessToken: async (): Promise<void> => {
    await apiClient.get('/auth/token');
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/logout');
  },
};
