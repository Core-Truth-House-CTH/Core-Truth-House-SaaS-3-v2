// Member brand font pickers (Identity Studio, Settings) offer fonts that are NOT
// CTH UI fonts (e.g. Inter). Their previews need those faces loaded, but the rest
// of the app must not pay for them, so they load only when a picker screen loads.
// Playfair Display preview faces are self-hosted in /estate-assets/fonts/fonts.css.
const INTER_PREVIEW_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap";

export function ensureMemberPreviewFonts() {
  if (typeof document === "undefined") return;
  if (document.querySelector("link[data-cth-member-preview-fonts]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = INTER_PREVIEW_HREF;
  link.setAttribute("data-cth-member-preview-fonts", "");
  document.head.appendChild(link);
}
