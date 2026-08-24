/**
 * Content Studio API service.
 *
 * Uses the shared apiClient, which already attaches the Clerk bearer token and
 * the X-Workspace-ID header, so tenant scoping and auth are inherited rather
 * than reimplemented here.
 */
import apiClient from "../../../lib/apiClient";

const BASE = "/api/content-studio";

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

export function getEntitlement(options) {
  return apiClient.get(`${BASE}/entitlement`, options);
}

export function startTrial(options) {
  return apiClient.post(`${BASE}/trial`, undefined, options);
}

export function listOfficialAgents(options) {
  return apiClient.get(`${BASE}/agents/official`, options);
}

export function listCustomAgents(options) {
  return apiClient.get(`${BASE}/agents`, options);
}

export function createCustomAgent(payload, options) {
  return apiClient.post(`${BASE}/agents`, payload, options);
}

export function updateCustomAgent(agentId, payload, options) {
  return apiClient.patch(`${BASE}/agents/${id(agentId)}`, payload, options);
}

export function deleteCustomAgent(agentId, options) {
  return apiClient.delete(`${BASE}/agents/${id(agentId)}`, options);
}

export function listStoryboards(options) {
  return apiClient.get(`${BASE}/storyboards`, options);
}

export function createStoryboard(payload, options) {
  return apiClient.post(`${BASE}/storyboards`, payload, options);
}

export function updateStoryboard(storyboardId, payload, options) {
  return apiClient.patch(`${BASE}/storyboards/${id(storyboardId)}`, payload, options);
}

/* ---------------------------------------------------------------- */
/* Production Director                                               */
/* ---------------------------------------------------------------- */

export function directProduction(payload, options) {
  return apiClient.post(`${BASE}/production/direct`, payload, options);
}

export function getProduction(productionId, options) {
  return apiClient.get(`${BASE}/production/${id(productionId)}`, options);
}

export function generateProductionFrame(productionId, shotId, options) {
  return apiClient.post(`${BASE}/production/${id(productionId)}/shots/${id(shotId)}/generate-frame`, undefined, options);
}

export function approveProductionFrame(productionId, shotId, options) {
  return apiClient.post(`${BASE}/production/${id(productionId)}/shots/${id(shotId)}/approve-frame`, undefined, options);
}

export function generateProductionMotion(productionId, shotId, options) {
  return apiClient.post(`${BASE}/production/${id(productionId)}/shots/${id(shotId)}/generate-motion`, undefined, options);
}

export function createEditRequest(payload, options) {
  return apiClient.post(`${BASE}/edit-requests`, payload, options);
}

export function listEditRequests({ status } = {}, options) {
  return apiClient.get(`${BASE}/edit-requests${q({ status })}`, options);
}

const AUTO = `${BASE}/automations`;

export function listAutomations({ status } = {}, options) {
  return apiClient.get(`${AUTO}${q({ status })}`, options);
}

export function createAutomation(payload, options) {
  return apiClient.post(AUTO, payload, options);
}

export function getAutomation(automationId, options) {
  return apiClient.get(`${AUTO}/${id(automationId)}`, options);
}

export function updateAutomation(automationId, payload, options) {
  return apiClient.patch(`${AUTO}/${id(automationId)}`, payload, options);
}

export function deleteAutomation(automationId, options) {
  return apiClient.delete(`${AUTO}/${id(automationId)}`, options);
}

export function testAutomation(automationId, options) {
  return apiClient.post(`${AUTO}/${id(automationId)}/test`, undefined, options);
}

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
  directProduction,
  getProduction,
  generateProductionFrame,
  approveProductionFrame,
  generateProductionMotion,
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
