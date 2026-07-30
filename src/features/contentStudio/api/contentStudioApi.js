/**
 * Content Studio API service — all 19 backend endpoints.
 *
 * Uses the shared apiClient, which already attaches the Clerk bearer token and
 * the X-Workspace-ID header, so tenant scoping and auth are inherited rather
 * than reimplemented here.
 *
 * Contract reference: backend/routes/content_studio.py and
 * backend/routes/content_studio_automations.py.
 */
import apiClient from "../../../lib/apiClient";

const BASE = "/api/content-studio";

/** Build a query string, omitting empty values. */
function q(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.append(key, String(value));
  });
  const s = search.toString();
  return s ? `?${s}` : "";
}

function id(value) {
  return encodeURIComponent(String(value ?? "").trim());
}

/* ---------------------------------------------------------------- */
/* Entitlement + trial                                              */
/* ---------------------------------------------------------------- */

/** GET /api/content-studio/entitlement */
export function getEntitlement(options) {
  return apiClient.get(`${BASE}/entitlement`, options);
}

/** POST /api/content-studio/trial -> 201, or 403 non-Estate, or 409 reused */
export function startTrial(options) {
  return apiClient.post(`${BASE}/trial`, undefined, options);
}

/* ---------------------------------------------------------------- */
/* Agents                                                            */
/* ---------------------------------------------------------------- */

/** GET /api/content-studio/agents/official */
export function listOfficialAgents(options) {
  return apiClient.get(`${BASE}/agents/official`, options);
}

/** GET /api/content-studio/agents — also returns embedded entitlement */
export function listCustomAgents(options) {
  return apiClient.get(`${BASE}/agents`, options);
}

/** POST /api/content-studio/agents -> 201 */
export function createCustomAgent(payload, options) {
  return apiClient.post(`${BASE}/agents`, payload, options);
}

/** PATCH /api/content-studio/agents/{agent_id} */
export function updateCustomAgent(agentId, payload, options) {
  return apiClient.patch(`${BASE}/agents/${id(agentId)}`, payload, options);
}

/** DELETE /api/content-studio/agents/{agent_id} -> 204. Not entitlement-gated. */
export function deleteCustomAgent(agentId, options) {
  return apiClient.delete(`${BASE}/agents/${id(agentId)}`, options);
}

/* ---------------------------------------------------------------- */
/* Storyboards                                                       */
/* ---------------------------------------------------------------- */

/** GET /api/content-studio/storyboards */
export function listStoryboards(options) {
  return apiClient.get(`${BASE}/storyboards`, options);
}

/** POST /api/content-studio/storyboards -> 201 */
export function createStoryboard(payload, options) {
  return apiClient.post(`${BASE}/storyboards`, payload, options);
}

/** PATCH /api/content-studio/storyboards/{storyboard_id} */
export function updateStoryboard(storyboardId, payload, options) {
  return apiClient.patch(`${BASE}/storyboards/${id(storyboardId)}`, payload, options);
}

/* ---------------------------------------------------------------- */
/* Edit requests                                                     */
/* ---------------------------------------------------------------- */

/** POST /api/content-studio/edit-requests -> 202 accepted/queued */
export function createEditRequest(payload, options) {
  return apiClient.post(`${BASE}/edit-requests`, payload, options);
}

/** GET /api/content-studio/edit-requests?status= */
export function listEditRequests({ status } = {}, options) {
  return apiClient.get(`${BASE}/edit-requests${q({ status })}`, options);
}

/* ---------------------------------------------------------------- */
/* Automations (Content Studio surface, NOT the platform engine)     */
/* ---------------------------------------------------------------- */

const AUTO = `${BASE}/automations`;

/** GET /api/content-studio/automations?status= */
export function listAutomations({ status } = {}, options) {
  return apiClient.get(`${AUTO}${q({ status })}`, options);
}

/** POST /api/content-studio/automations -> 201, always persisted as draft */
export function createAutomation(payload, options) {
  return apiClient.post(AUTO, payload, options);
}

/** GET /api/content-studio/automations/{automation_id} */
export function getAutomation(automationId, options) {
  return apiClient.get(`${AUTO}/${id(automationId)}`, options);
}

/** PATCH /api/content-studio/automations/{automation_id} */
export function updateAutomation(automationId, payload, options) {
  return apiClient.patch(`${AUTO}/${id(automationId)}`, payload, options);
}

/** DELETE /api/content-studio/automations/{automation_id} -> 204 */
export function deleteAutomation(automationId, options) {
  return apiClient.delete(`${AUTO}/${id(automationId)}`, options);
}

/** POST /api/content-studio/automations/{automation_id}/test */
export function testAutomation(automationId, options) {
  return apiClient.post(`${AUTO}/${id(automationId)}/test`, undefined, options);
}

/** GET /api/content-studio/automations/{automation_id}/runs?limit=1..100 */
export function listAutomationRuns(automationId, { limit = 25 } = {}, options) {
  return apiClient.get(`${AUTO}/${id(automationId)}/runs${q({ limit })}`, options);
}

export default {
  getEntitlement,
  startTrial,
  listOfficialAgents,
  listCustomAgents,
  createCustomAgent,
  updateCustomAgent,
  deleteCustomAgent,
  listStoryboards,
  createStoryboard,
  updateStoryboard,
  createEditRequest,
  listEditRequests,
  listAutomations,
  createAutomation,
  getAutomation,
  updateAutomation,
  deleteAutomation,
  testAutomation,
  listAutomationRuns,
};
