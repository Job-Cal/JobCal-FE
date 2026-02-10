export interface JobPosting {
  id: number;
  company_name: string;
  job_title: string;
  deadline: string | null;
  original_url: string;
  parsed_data: Record<string, any> | null;
  description: string | null;
  location: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface JobPostingParseRequest {
  url: string;
}

export interface JobPostingParseResponse {
  success: boolean;
  data?: JobPostingCreate;
  error?: string;
}

export interface JobPostingCreate {
  company_name: string;
  job_title: string;
  deadline: string | null;
  original_url: string;
  parsed_data?: Record<string, any>;
  description?: string | null;
  location?: string | null;
}

