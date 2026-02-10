import { JobPosting } from './job';

export enum ApplicationStatus {
  NOT_APPLIED = 'not_applied',
  APPLIED = 'applied',
  IN_PROGRESS = 'in_progress',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted',
}

export interface Application {
  id: number;
  user_id: number;
  job_posting_id: number;
  status: ApplicationStatus;
  memo: string | null;
  created_at: string;
  updated_at: string | null;
  job_posting: JobPosting;
}

export interface ApplicationUpdate {
  status?: ApplicationStatus;
  memo?: string | null;
}

export const ApplicationStatusLabels: Record<ApplicationStatus, string> = {
  [ApplicationStatus.NOT_APPLIED]: '미지원',
  [ApplicationStatus.APPLIED]: '지원완료',
  [ApplicationStatus.IN_PROGRESS]: '진행중',
  [ApplicationStatus.REJECTED]: '탈락',
  [ApplicationStatus.ACCEPTED]: '합격',
};

export const ApplicationStatusColors: Record<ApplicationStatus, string> = {
  [ApplicationStatus.NOT_APPLIED]: '#6b7280', // gray
  [ApplicationStatus.APPLIED]: '#3b82f6', // blue
  [ApplicationStatus.IN_PROGRESS]: '#f59e0b', // amber
  [ApplicationStatus.REJECTED]: '#ef4444', // red
  [ApplicationStatus.ACCEPTED]: '#10b981', // green
};

