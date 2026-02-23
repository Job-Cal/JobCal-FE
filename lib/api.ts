import axios from 'axios';
import { JobPosting, JobPostingParseRequest, JobPostingParseResponse, JobPostingCreate } from '@/types/job';
import { Application, ApplicationStatus, ApplicationUpdate } from '@/types/application';
import { FeedbackCreateRequest } from '@/types/feedback';
import { getAuthToken, parseBearerToken, removeAuthToken, setAuthToken } from '@/lib/auth';
import { AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const OAUTH_START_PATH =
  process.env.NEXT_PUBLIC_OAUTH_START_PATH || '/api/oauth2/authorization/cognito';
const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
const COGNITO_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const COGNITO_LOGOUT_URL = process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URL;
const LOGIN_PAGE_PATH = '/login';
const REFRESH_TOKEN_PATH = '/auth/refresh';

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

type RetryableAxiosRequestConfig = AxiosRequestConfig & { _retry?: boolean };
let refreshTokenPromise: Promise<string | null> | null = null;

const isRefreshRequest = (config?: AxiosRequestConfig): boolean => {
  const requestUrl = `${config?.baseURL ?? ''}${config?.url ?? ''}`;
  return requestUrl.includes(REFRESH_TOKEN_PATH);
};

const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}${REFRESH_TOKEN_PATH}`, {
        withCredentials: true,
      });

      const headerValue = response.headers?.authorization ?? response.headers?.Authorization;
      const tokenFromHeader = parseBearerToken(headerValue);
      const tokenFromBody =
        typeof response.data?.accessToken === 'string' ? response.data.accessToken : null;
      const nextToken = tokenFromHeader ?? tokenFromBody;

      if (!nextToken) {
        removeAuthToken();
        return null;
      }

      setAuthToken(nextToken);
      return nextToken;
    } catch {
      removeAuthToken();
      return null;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
};

apiClient.interceptors.request.use(async (config) => {
  if (isRefreshRequest(config)) {
    return config;
  }

  let token = getAuthToken();
  if (!token) {
    token = await refreshAccessToken();
  }

  if (!token) {
    return Promise.reject(new axios.CanceledError('Missing, expired, or non-refreshable access token'));
  }

  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${token}`;
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
  async (error) => {
    if (error?.response?.status === 401) {
      const originalRequest: RetryableAxiosRequestConfig | undefined = error?.config;

      if (!originalRequest || originalRequest._retry || isRefreshRequest(originalRequest)) {
        removeAuthToken();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshedToken = await refreshAccessToken();

      if (!refreshedToken) {
        return Promise.reject(error);
      }

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
      return apiClient(originalRequest);
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
    const response = await axios.post<JobPostingParseResponse>(
      `${API_BASE_URL}/jobs/parse`,
      { url },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
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

  update: async (id: number, updateData: ApplicationUpdate): Promise<Application> => {
    const response = await apiClient.patch<Application>(`/applications/${id}/status`, updateData);
    console.log('application update response:', response.data);
    return normalizeApplication(response.data);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/applications/${id}`);
  },
};

export const feedbackApi = {
  create: async (payload: FeedbackCreateRequest): Promise<void> => {
    await apiClient.post('/feedback', payload);
  },
};

// Auth (start via BE OAuth2 to ensure session cookie is set)

export const authApi = {
  getLoginUrl: (): string => OAUTH_START_PATH,
  getLogoutUrl: (): string | null => {
    if (COGNITO_LOGOUT_URL) {
      return COGNITO_LOGOUT_URL;
    }
    if (!COGNITO_DOMAIN || !COGNITO_CLIENT_ID || typeof window === 'undefined') {
      return null;
    }

    const domain = COGNITO_DOMAIN.endsWith('/') ? COGNITO_DOMAIN.slice(0, -1) : COGNITO_DOMAIN;
    const logoutUri = `${window.location.origin}${LOGIN_PAGE_PATH}`;
    return `${domain}/logout?client_id=${encodeURIComponent(COGNITO_CLIENT_ID)}&logout_uri=${encodeURIComponent(logoutUri)}`;
  },
  fetchAccessToken: async (): Promise<boolean> => {
    const token = await refreshAccessToken();
    return Boolean(token);
  },
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/logout');
    } catch (error) {
      console.warn('Logout API request failed:', error);
    } finally {
      removeAuthToken();
    }
  },
  logoutAll: async (): Promise<void> => {
    await authApi.logout();

    if (typeof window === 'undefined') {
      return;
    }

    const logoutUrl = authApi.getLogoutUrl();
    window.location.href = logoutUrl || LOGIN_PAGE_PATH;
  },
};
