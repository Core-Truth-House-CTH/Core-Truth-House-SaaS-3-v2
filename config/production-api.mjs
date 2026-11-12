// The one place the production API address lives. Production builds inline it as the
// default for pages that have no VITE_API_BASE_URL set; staging builds get no default
// (see vite.config.js) and are scanned for this address after the build.
export const productionApiOrigin = "https://api.coretruthhouse.com";
