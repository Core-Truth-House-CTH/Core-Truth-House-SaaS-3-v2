// Pure runtime checks, shared by the browser helper and offline unit tests.
export function assertPinnedApiTarget(value, origin, { originOnly = false } = {}) {
  let target;
  let pinned;
  try {
    pinned = new URL(origin);
    target = new URL(value);
  } catch {
    throw new Error("Staging API target must be an absolute URL with a reviewed origin.");
  }
  if (!origin || pinned.protocol !== "https:" || pinned.origin !== origin ||
      target.origin !== origin || target.username || target.password ||
      target.protocol !== "https:" || /[\\\\]/.test(value) ||
      (originOnly && value !== origin)) {
    throw new Error("Staging API target does not match the reviewed origin.");
  }
  return value;
}
