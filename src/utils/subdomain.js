// Tenant subdomain detection for public offer pages.
//
// A tenant offer page can be reached two ways:
//   1. Path-based on the apex:   coretruthhouse.com/offers/{slug}/{offerSlug}
//   2. Subdomain-based:          {slug}.coretruthhouse.com/offers/{offerSlug}
//
// getWorkspaceSlugFromHost() extracts {slug} from the hostname for case 2.
// Returns null for the apex domain, reserved hosts (www/api/app/admin),
// multi-level hosts, custom domains, localhost, or anything that is not a
// single-label *.coretruthhouse.com host.

const ROOT_DOMAIN = "coretruthhouse.com";
const RESERVED_LABELS = new Set(["www", "api", "app", "admin"]);

export function getWorkspaceSlugFromHost(hostname) {
  const host = String(
    hostname != null
      ? hostname
      : typeof window !== "undefined"
      ? window.location.hostname
      : ""
  )
    .toLowerCase()
    .trim();

  if (!host) return null;

  const suffix = `.${ROOT_DOMAIN}`;
  // Must be a subdomain of coretruthhouse.com (not the apex, not another domain).
  if (!host.endsWith(suffix)) return null;

  const label = host.slice(0, -suffix.length);
  // Empty => apex ("coretruthhouse.com"); a dot => multi-level (e.g. a.b.coretruthhouse.com).
  if (!label || label.includes(".")) return null;
  if (RESERVED_LABELS.has(label)) return null;

  return label;
}

export default getWorkspaceSlugFromHost;
