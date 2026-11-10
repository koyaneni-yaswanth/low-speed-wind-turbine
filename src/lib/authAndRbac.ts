import type { UserRole } from '../types/index.ts';

export type PermissionScope =
  | 'view_public_site'
  | 'view_engineering_dashboard'
  | 'edit_engineering_records'
  | 'ingest_telemetry'
  | 'view_crm'
  | 'edit_crm'
  | 'view_financials_bom'
  | 'edit_financials_bom'
  | 'view_grants_dataroom'
  | 'edit_grants_dataroom'
  | 'view_private_documents'
  | 'manage_cms_and_roles'
  | 'view_audit_logs';

const ROLE_PERMISSIONS: Record<UserRole, Set<PermissionScope>> = {
  founder_super_admin: new Set([
    'view_public_site',
    'view_engineering_dashboard',
    'edit_engineering_records',
    'ingest_telemetry',
    'view_crm',
    'edit_crm',
    'view_financials_bom',
    'edit_financials_bom',
    'view_grants_dataroom',
    'edit_grants_dataroom',
    'view_private_documents',
    'manage_cms_and_roles',
    'view_audit_logs',
  ]),
  engineering_admin: new Set([
    'view_public_site',
    'view_engineering_dashboard',
    'edit_engineering_records',
    'ingest_telemetry',
    'view_grants_dataroom',
    'view_private_documents',
  ]),
  crm_admin: new Set([
    'view_public_site',
    'view_crm',
    'edit_crm',
    'view_grants_dataroom',
  ]),
  team_member: new Set([
    'view_public_site',
    'view_engineering_dashboard',
    // Explicitly restricted: NO access to financial scenarios, CRM PII, private agreements, or audit logs
  ]),
  external_reviewer: new Set([
    'view_public_site',
    'view_engineering_dashboard',
    'view_grants_dataroom',
  ]),
  public_visitor: new Set(['view_public_site']),
};

export function hasPermission(role: UserRole, scope: PermissionScope): boolean {
  return ROLE_PERMISSIONS[role]?.has(scope) ?? false;
}

export function canAccessAdminRoute(role: UserRole): boolean {
  return role !== 'public_visitor';
}

export const ROLE_LABELS: Record<UserRole, string> = {
  founder_super_admin: 'Founder / Super Admin',
  engineering_admin: 'Engineering Admin',
  crm_admin: 'Business / CRM Admin',
  team_member: 'Team Member (Engineering)',
  external_reviewer: 'External / Incubator Reviewer',
  public_visitor: 'Public Visitor',
};
