// Brand Expression page data. The three reads are independent: one failing must not blank the whole page.
//   /api/identity               404 = this workspace has not saved a visual identity yet -> empty form, not an error
//   /api/persist/brand-foundation  holds tone of voice; without it the page cannot show or save tone safely -> error
//   /api/media-upload/assets       optional; on failure the form still shows, with a short notice
export const IDENTITY_PATH = "/api/identity";
export const FOUNDATION_PATH = "/api/persist/brand-foundation";
export const ASSETS_PATH = "/api/media-upload/assets";

const message = (e, fallback) => (e && typeof e.message === "string" && e.message) || fallback;

export async function loadExpressionData(get, { userId, workspaceId } = {}) {
  const [identity, foundation, assets] = await Promise.allSettled([
    get(IDENTITY_PATH, { params: userId ? { user_id: userId } : {} }),
    get(FOUNDATION_PATH),
    workspaceId
      ? get(ASSETS_PATH, { params: { category: "brand_asset", workspace_id: workspaceId } })
      : Promise.resolve({ assets: [] }),
  ]);

  if (foundation.status === "rejected") {
    return { error: message(foundation.reason, "Brand expression data could not be loaded.") };
  }
  let identityDoc;
  if (identity.status === "fulfilled") identityDoc = identity.value || {};
  else if (identity.reason?.status === 404) identityDoc = {};          // nothing saved yet
  else return { error: message(identity.reason, "Brand expression data could not be loaded.") };

  const list = assets.status === "fulfilled" && Array.isArray(assets.value?.assets) ? assets.value.assets : [];
  return {
    error: "",
    identity: identityDoc,
    identitySaved: identity.status === "fulfilled",
    foundation: foundation.value?.foundation || foundation.value || {},
    assets: list.filter((item) => item.status === "confirmed" && item.context === "brand_asset"),
    assetsError: assets.status === "rejected" ? "Brand assets could not be loaded right now. You can still edit and save this section." : "",
  };
}
