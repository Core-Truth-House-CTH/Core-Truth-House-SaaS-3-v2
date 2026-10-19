const PLACEHOLDER_VERSIONS = new Set([
  'dev',
  'development',
  'local',
  'none',
  'null',
  'unknown',
  'undefined',
])

export function normalizeReleaseVersion(value) {
  if (typeof value !== 'string') return null

  const normalized = value.trim()
  if (!normalized || PLACEHOLDER_VERSIONS.has(normalized.toLowerCase())) return null

  return normalized
}

export function shouldOfferAppUpdate(currentVersion, availableVersion) {
  const current = normalizeReleaseVersion(currentVersion)
  const available = normalizeReleaseVersion(availableVersion)

  return Boolean(current && available && current !== available)
}

export function getReleaseMetadataUrl(cacheBuster = Date.now()) {
  return `/version.json?_=${encodeURIComponent(String(cacheBuster))}`
}
