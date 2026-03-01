export interface JobMessage {
  jobId: string;
  tenantId: string;
  payload: unknown;
  forceError?: boolean;
}
