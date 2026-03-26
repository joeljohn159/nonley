export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  actionType: string;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  createdAt: Date;
}
