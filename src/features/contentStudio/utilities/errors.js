/**
 * Content Studio API error classification.
 *
 * The backend distinguishes these deliberately and the UI must not blur them:
 *   402 -> caller IS on Estate but has no active trial or add-on. Recoverable
 *          by starting a trial or buying the add-on. NOT an auth failure.
 *   403 -> caller's plan or workspace permission does not qualify. Not a
 *          payment problem; showing a billing dialog here would be wrong.
 *   404 -> resource missing OR owned by another workspace. The backend returns
 *          an identical 404 for both so foreign-tenant existence is never
 *          disclosed; the copy here must not hint that it exists elsewhere.
 *   409 -> conflict, e.g. the workspace trial was already used.
 */

export const CS_ERROR = {
  UNAUTHENTICATED: "unauthenticated",
  ENTITLEMENT_REQUIRED: "entitlement_required",
  PLAN_REQUIRED: "plan_required",
  PERMISSION_DENIED: "permission_denied",
  NOT_FOUND: "not_found",
  CONFLICT: "conflict",
  VALIDATION: "validation",
  SERVER: "server",
  NETWORK: "network",
  UNKNOWN: "unknown",
};

/** Detail strings the backend uses; matched to separate 403 sub-cases. */
const PERMISSION_HINT = /creator or a workspace owner\/admin|workspace membership required/i;

export function classifyApiError(error) {
  if (!error) {
    return { kind: CS_ERROR.UNKNOWN, status: null, message: "Something went wrong." };
  }

  const status = typeof error.status === "number" ? error.status : null;
  const detail = String(error.message || "").trim();

  if (status === null) {
    return {
      kind: CS_ERROR.NETWORK,
      status: null,
      message: "We could not reach Core Truth House. Check your connection and try again.",
      retryable: true,
    };
  }

  switch (status) {
    case 401:
      return {
        kind: CS_ERROR.UNAUTHENTICATED,
        status,
        message: "Your session has expired. Sign in again to continue.",
        retryable: false,
      };

    case 402:
      return {
        kind: CS_ERROR.ENTITLEMENT_REQUIRED,
        status,
        title: "Agents & Automations add-on required",
        message:
          "Your workspace is on Estate, but this needs an active trial or the Agents & Automations add-on.",
        retryable: false,
      };

    case 403:
      // Two distinct 403s. Permission is about WHO you are in the workspace;
      // the plan case is about WHAT the workspace has bought.
      if (PERMISSION_HINT.test(detail)) {
        return {
          kind: CS_ERROR.PERMISSION_DENIED,
          status,
          title: "You do not have permission",
          message: detail || "Only the creator or a workspace owner/admin can do this.",
          retryable: false,
        };
      }
      return {
        kind: CS_ERROR.PLAN_REQUIRED,
        status,
        title: "Estate plan required",
        message: "Content Studio creation tools are available on the Estate plan.",
        retryable: false,
      };

    case 404:
      return {
        kind: CS_ERROR.NOT_FOUND,
        status,
        title: "Not available",
        message: "This item is not available in your workspace.",
        retryable: false,
      };

    case 409:
      return {
        kind: CS_ERROR.CONFLICT,
        status,
        title: "Already used",
        message: detail || "This workspace has already used its Content Studio trial.",
        retryable: false,
      };

    case 422:
      return {
        kind: CS_ERROR.VALIDATION,
        status,
        title: "Check the form",
        message: detail || "Some fields need attention before this can be saved.",
        retryable: false,
      };

    default:
      break;
  }

  if (status >= 500) {
    return {
      kind: CS_ERROR.SERVER,
      status,
      title: "Core Truth House is having trouble",
      message: "The server could not complete that request. Please try again shortly.",
      retryable: true,
    };
  }

  return {
    kind: CS_ERROR.UNKNOWN,
    status,
    message: detail || "Something went wrong.",
    retryable: true,
  };
}

/** True when the failure should surface trial/add-on activation UI. */
export function isEntitlementError(error) {
  return classifyApiError(error).kind === CS_ERROR.ENTITLEMENT_REQUIRED;
}

/** True when the failure is about plan tier rather than payment state. */
export function isPlanError(error) {
  return classifyApiError(error).kind === CS_ERROR.PLAN_REQUIRED;
}
