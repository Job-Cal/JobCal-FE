import { JobPosting } from './job';

export enum ApplicationStatus {
  NOT_APPLIED = 'NOT_APPLIED',
  APPLIED = 'APPLIED',
  IN_PROGRESS = 'IN_PROGRESS',
  REJECTED = 'REJECTED',
  ACCEPTED = 'ACCEPTED',
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
  [ApplicationStatus.NOT_APPLIED]: '#6b7280',
  [ApplicationStatus.APPLIED]: '#3b82f6',
  [ApplicationStatus.IN_PROGRESS]: '#0ea5e9',
  [ApplicationStatus.REJECTED]: '#ef4444',
  [ApplicationStatus.ACCEPTED]: '#22c55e',
};

export const ApplicationStatusStyles: Record<
  ApplicationStatus,
  { bg: string; text: string; border: string; accent: string }
> = {
  [ApplicationStatus.NOT_APPLIED]: {
    bg: '#f3f4f6',
    text: '#4b5563',
    border: '#d1d5db',
    accent: '#9ca3af',
  },
  [ApplicationStatus.APPLIED]: {
    bg: '#eaf2ff',
    text: '#1d4ed8',
    border: '#c7dbff',
    accent: '#3b82f6',
  },
  [ApplicationStatus.IN_PROGRESS]: {
    bg: '#e8f8ff',
    text: '#0369a1',
    border: '#b6e3ff',
    accent: '#0ea5e9',
  },
  [ApplicationStatus.REJECTED]: {
    bg: '#ffe5e5',
    text: '#b91c1c',
    border: '#fecaca',
    accent: '#ef4444',
  },
  [ApplicationStatus.ACCEPTED]: {
    bg: '#e8f7ee',
    text: '#166534',
    border: '#c7ebd3',
    accent: '#22c55e',
  },
};
