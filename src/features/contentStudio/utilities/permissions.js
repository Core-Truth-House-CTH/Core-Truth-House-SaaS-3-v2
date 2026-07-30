/**
 * Client-side mirror of the backend's Content Studio deletion rule.
 *
 * Backend (_may_delete in backend/routes/content_studio.py) allows deletion when:
 *   1. caller is a super admin, OR
 *   2. doc.created_by is non-empty AND equals caller user id, OR
 *   3. caller's workspace role is in {owner, admin}
 *
 * A row with no created_by (legacy, predating the field) is owner/admin only.
 *
 * This is presentation only. The backend remains authoritative — hiding a
 * button is a courtesy, never a security control.
 */

export const WORKSPACE_ADMIN_ROLES = Object.freeze(["owner", "admin"]);

function normalize(value) {
  return String(value ?? "").trim();
}

export function isWorkspaceAdminRole(role) {
  return WORKSPACE_ADMIN_ROLES.includes(normalize(role).toLowerCase());
}

/**
 * @param {object} viewer  { userId, role, isSuperAdmin }
 * @param {object} resource  any doc carrying created_by
 */
export function canDeleteResource(viewer, resource) {
  if (!viewer || !resource) return false;

  if (viewer.isSuperAdmin === true) return true;

  const creator = normalize(resource.created_by);
  const caller = normalize(viewer.userId);
  if (creator && creator === caller) return true;

  return isWorkspaceAdminRole(viewer.role);
}

/** Explains a hidden/disabled delete control to the user. */
export function deleteDenialReason(viewer, resource) {
  if (canDeleteResource(viewer, resource)) return null;

  if (!normalize(resource?.created_by)) {
    return "This item predates creator tracking, so only a workspace owner or admin can remove it.";
  }
  return "Only the person who created this, or a workspace owner or admin, can remove it.";
}

/** Mutation (create/edit/test) requires entitlement; deletion never does. */
export function canMutate(entitlement) {
  return Boolean(entitlement?.custom_creation_allowed);
}
