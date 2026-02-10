import axios from 'axios';
import { JobPosting, JobPostingParseRequest, JobPostingParseResponse, JobPostingCreate } from '@/types/job';
import { Application, ApplicationUpdate } from '@/types/application';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set. Define it in .env.local');
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
    return response.data;
  },

  getById: async (id: number): Promise<Application> => {
    const response = await apiClient.get<Application>(`/applications/${id}`);
    return response.data;
  },

  updateStatus: async (id: number, updateData: ApplicationUpdate): Promise<Application> => {
    const response = await apiClient.patch<Application>(`/applications/${id}/status`, updateData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/applications/${id}`);
  },
};
