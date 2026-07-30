import React from "react";

import PlannedScreenPage from "./PlannedScreenPage";

/**
 * Approved screens 2, 7, 8, 9 and 12 are routed but intentionally not built in
 * this session. Each placeholder names its real blocker so the remaining work
 * is legible from the app itself, not just the session report.
 */

export function ComposerPage() {
  return (
    <PlannedScreenPage
      title="AI Content Composer"
      subtitle="Strategic content, composed with your brand memory."
      summary="The approved composer needs a conversational endpoint with brand-memory context, saved outputs, and the Improve / Shorten / Expand / Change Tone / Translate / Repurpose actions. The existing /api/prompt-generator routes are single-shot generate-and-save only, so they cannot back this screen without new contracts."
      dependsOn={[
        "A conversational compose endpoint that accepts prior turns and a project id",
        "Brand Memory context retrieval for the left rail",
        "Output variants and per-output refinement actions",
      ]}
    />
  );
}

export function ImageGeneratorPage() {
  return (
    <PlannedScreenPage
      title="Image Generator"
      subtitle="On-brand images from a prompt."
      summary="POST /api/media/generate-image already exists and can back the prompt and result grid. It does not yet accept aspect ratio, brand style, character consistency, or prompt enhancement, and it is not entitlement-aware for Content Studio, so wiring it now would silently drop those approved controls."
      dependsOn={[
        "Aspect ratio, brand style, and character-consistency parameters on /api/media/generate-image",
        "A prompt-enhancement endpoint",
        "Confirmation of how generated images enter the Content Studio media library",
      ]}
    />
  );
}

export function MediaLibraryPage() {
  return (
    <PlannedScreenPage
      title="Media Library"
      subtitle="Every asset your brand has made."
      summary="Two real sources exist — GET /api/media/gallery for generated media and GET /api/media-upload/assets for uploads — but they return different shapes and different id fields (id vs asset_id). A single merged, paginated view needs an agreed contract before the approved filters and tabs can be built truthfully."
      dependsOn={[
        "An agreed merged media list shape across generated media and uploaded assets",
        "Type / project / sort filter support on the server",
      ]}
    />
  );
}

export function MediaViewerPage() {
  return (
    <PlannedScreenPage
      title="Image Viewer & Edit"
      subtitle="Review an asset and act on it."
      summary="The viewer depends on the merged media contract above so it can resolve a single media id to its details, filmstrip neighbours, and actions. Request Edit is already live and can be reached directly."
      dependsOn={["The merged media list and detail contract"]}
      backTo="/content-studio/edit-requests/new"
    />
  );
}

export function MediaUploadPage() {
  return (
    <PlannedScreenPage
      title="Upload Media"
      subtitle="Bring existing assets into the studio."
      summary="POST /api/media-upload/upload-asset already accepts uploads with project, tags, and context. The approved screen additionally captures usage rights and an AI-generated declaration, which the current asset record does not store."
      dependsOn={[
        "Usage rights and ai_generated fields on the media asset record",
        "The merged media list so an upload lands somewhere visible",
      ]}
    />
  );
}

export default {
  ComposerPage,
  ImageGeneratorPage,
  MediaLibraryPage,
  MediaViewerPage,
  MediaUploadPage,
};
