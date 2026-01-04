// ==================== STATUS TYPES ====================
export const Statuses = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
} as const;

export type StatusType = (typeof Statuses)[keyof typeof Statuses];
