export interface FeedbackCreateRequest {
  category: 'BUG' | 'FEATURE' | 'UX' | 'OTHER';
  message: string;
  pagePath?: string;
}
