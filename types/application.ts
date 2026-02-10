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
  [ApplicationStatus.APPLIED]: '#fee500',
  [ApplicationStatus.IN_PROGRESS]: '#ffb020',
  [ApplicationStatus.REJECTED]: '#ff5a5a',
  [ApplicationStatus.ACCEPTED]: '#34c759',
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
    bg: '#fff7cc',
    text: '#1a1a1a',
    border: '#f0de8d',
    accent: '#fee500',
  },
  [ApplicationStatus.IN_PROGRESS]: {
    bg: '#fff1d6',
    text: '#7a4a00',
    border: '#ffd7a0',
    accent: '#ffb020',
  },
  [ApplicationStatus.REJECTED]: {
    bg: '#ffe5e5',
    text: '#b91c1c',
    border: '#fecaca',
    accent: '#ff5a5a',
  },
  [ApplicationStatus.ACCEPTED]: {
    bg: '#e8fff1',
    text: '#0f7a3a',
    border: '#b7f3cd',
    accent: '#34c759',
  },
};
