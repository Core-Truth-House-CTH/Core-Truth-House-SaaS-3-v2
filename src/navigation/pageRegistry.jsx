import React, { lazy } from "react";
import PlaceholderPage from "../pages/PlaceholderPage";

const makePlaceholder = (title) => () => <PlaceholderPage title={title} />;

const CommandCenterNext = lazy(() => import("../pages/CommandCenterNext"));
const BrandHouse = lazy(() => import("../pages/BrandHouse"));
const WorkspacePage = lazy(() => import("../pages/WorkspacePage"));
const ReportsShell = lazy(() => import("../pages/ReportsShell"));
const Billing = lazy(() => import("../pages/Billing"));
const BrandIntelligencePage = lazy(() => import("../pages/BrandIntelligencePage"));
const BrandAudit = lazy(() => import("../pages/BrandAudit"));
const BrandFoundation = lazy(() => import("../pages/BrandFoundation"));
const BrandPositioning = lazy(() => import("../pages/BrandPositioning"));
const MessagingStructure = lazy(() => import("../pages/MessagingStructure"));
const Audience = lazy(() => import("../pages/Audience"));
const AvatarEditor = lazy(() => import("../pages/AvatarEditor"));
const BrandHealthDashboard = lazy(() => import("../pages/BrandHealthDashboard"));
const StrategicOS = lazy(() => import("../pages/StrategicOS"));
const SystemsBuilder = lazy(() => import("../pages/SystemsBuilder"));
const SignalInbox = lazy(() => import("../pages/SignalInbox"));
const CustomerJourney = lazy(() => import("../pages/CustomerJourney"));
const Settings = lazy(() => import("../pages/Settings"));
const Alerts = lazy(() => import("../pages/Alerts"));
const CRMSuite = lazy(() => import("../pages/CRMSuite"));
const ContactRecordPage = lazy(() => import("../pages/crm/ContactRecordPage"));
const MailSuite = lazy(() => import("../pages/MailSuite"));
const EmailSettings = lazy(() => import("../pages/EmailSettings"));
const TenantDataDashboardV2 = lazy(() => import("../pages/TenantDataDashboardV2"));
const ContentStudio = lazy(() => import("../pages/ContentStudio"));

const CSDashboard = lazy(() => import("../features/contentStudio/pages/DashboardPage"));
const CSAgents = lazy(() => import("../features/contentStudio/pages/AgentsPage"));
const CSAgentDetail = lazy(() => import("../features/contentStudio/pages/AgentDetailPage"));
const CSAgentCreate = lazy(() => import("../features/contentStudio/pages/AgentCreatePage"));
const CSAutomations = lazy(() => import("../features/contentStudio/pages/AutomationsPage"));
const CSAutomationDetail = lazy(() => import("../features/contentStudio/pages/AutomationDetailPage"));
const CSStoryboards = lazy(() => import("../features/contentStudio/pages/StoryboardsProductionHub"));
const CSEditRequests = lazy(() => import("../features/contentStudio/pages/EditRequestsPage"));
const CSNotFound = lazy(() => import("../features/contentStudio/pages/NotFoundPage"));
const CSComposer = lazy(() =>
  import("../features/contentStudio/pages/plannedScreens").then((m) => ({ default: m.ComposerPage })),
);
const CSImageGenerator = lazy(() =>
  import("../features/contentStudio/pages/plannedScreens").then((m) => ({ default: m.ImageGeneratorPage })),
);
const CSMediaLibrary = lazy(() =>
  import("../features/contentStudio/pages/plannedScreens").then((m) => ({ default: m.MediaLibraryPage })),
);
const CSMediaViewer = lazy(() =>
  import("../features/contentStudio/pages/plannedScreens").then((m) => ({ default: m.MediaViewerPage })),
);
const CSMediaUpload = lazy(() =>
  import("../features/contentStudio/pages/plannedScreens").then((m) => ({ default: m.MediaUploadPage })),
);
const CampaignBuilder = lazy(() => import("../pages/CampaignBuilder"));
const CampaignSetup = lazy(() => import("../pages/CampaignSetup"));
const IdentityStudio = lazy(() => import("../pages/IdentityStudio"));
const OfferBuilder = lazy(() => import("../pages/OfferBuilder"));
const LaunchPlanner = lazy(() => import("../pages/LaunchPlanner"));
const Calendar = lazy(() => import("../pages/Calendar"));
const SocialMediaManager = lazy(() => import("../pages/SocialMediaManager"));
const ContentQueue = lazy(() => import("../pages/ContentQueue"));
const CommunityPage = lazy(() => import("../pages/CommunityPage"));
const KnowledgeBasePage = lazy(() => import("../pages/KnowledgeBasePage"));
const JoinWorkspace = lazy(() => import("../pages/JoinWorkspace"));
const CohortManager = lazy(() => import("../pages/CohortManager"));
const VideoTutorialsPage = lazy(() => import("../pages/VideoTutorialsPage"));
const OnboardingWorkflow = lazy(() => import("../pages/OnboardingWorkflow"));
const Automations = lazy(() => import("../pages/Automations"));
const Studios = lazy(() => import("../pages/Studios"));
const StudiosHeadshot = lazy(() => import("../pages/StudiosHeadshot"));
const StudiosVisual = lazy(() => import("../pages/StudiosVisual"));
const StudiosVideo = lazy(() => import("../pages/StudiosVideo"));
const StudiosVoice = lazy(() => import("../pages/StudiosVoice"));
const StudiosBio = lazy(() => import("../pages/StudiosBio"));
const Members = lazy(() => import("../pages/Members"));

const FirstCampaign = CampaignBuilder;

const pageRegistry = {
  "/onboarding": OnboardingWorkflow,
  "/command-center": CommandCenterNext,
  "/command-center-next": CommandCenterNext,
  "/brand-house": BrandHouse,
  "/workspace": WorkspacePage,
  "/my-data": TenantDataDashboardV2,

  "/brand-audit": BrandAudit,
  "/brand-memory": BrandFoundation,
  "/brand-foundation": BrandFoundation,
  "/brand-positioning": BrandPositioning,
  "/messaging-structure": MessagingStructure,
  "/audience": Audience,
  "/audience/avatars/new": AvatarEditor,
  "/audience/avatars/:id": AvatarEditor,
  "/brand-intelligence": BrandIntelligencePage,
  "/brand-health": BrandHealthDashboard,

  "/strategic-os": StrategicOS,
  "/systems-builder": SystemsBuilder,
  "/signal-inbox": SignalInbox,
  "/customer-journey": CustomerJourney,

  "/content-studio": CSDashboard,
  "/content-studio/prompt-generator": ContentStudio,
  "/content-studio/composer": CSComposer,
  "/content-studio/agents": CSAgents,
  "/content-studio/agents/new": CSAgentCreate,
  "/content-studio/agents/:agentId": CSAgentDetail,
  "/content-studio/automations": CSAutomations,
  "/content-studio/automations/:automationId": CSAutomationDetail,
  "/content-studio/images/generate": CSImageGenerator,
  "/content-studio/media": CSMediaLibrary,
  "/content-studio/media/upload": CSMediaUpload,
  "/content-studio/media/:mediaId": CSMediaViewer,
  "/content-studio/storyboards": CSStoryboards,
  "/content-studio/edit-requests/new": CSEditRequests,
  "/content-studio/*": CSNotFound,
  "/studios": Studios,
  "/studios/headshot": StudiosHeadshot,
  "/studios/visual": StudiosVisual,
  "/studios/video": StudiosVideo,
  "/studios/voice": StudiosVoice,
  "/studios/bio": StudiosBio,
  "/campaign-builder": CampaignBuilder,
  "/campaign-setup": CampaignSetup,
  "/first-campaign": FirstCampaign,
  "/identity-studio": IdentityStudio,

  "/offer-builder": OfferBuilder,
  "/launch-planner": LaunchPlanner,

  "/calendar": Calendar,
  "/social-media-manager": SocialMediaManager,
  "/content-queue": ContentQueue,
  "/community": CommunityPage,
  "/cohort-manager": CohortManager,

  "/crm": CRMSuite,
  "/crm/contacts/:id": ContactRecordPage,
  "/email-settings": EmailSettings,
  "/mail": MailSuite,
  "/analytics": ReportsShell,

  "/tutorials": VideoTutorialsPage,
  "/documents": TenantDataDashboardV2,
  "/workspace-library": TenantDataDashboardV2,
  "/billing": Billing,
  "/settings": Settings,
  "/alerts": Alerts,

  "/automations": Automations,
  "/join": JoinWorkspace,
  "/members": Members,
  "/help-desk": makePlaceholder("Help Desk"),
  "/knowledge-base": KnowledgeBasePage,
  "/release-notes": makePlaceholder("Release Notes"),
  "/ai-keys": makePlaceholder("AI API Keys"),
  "/platform-store": makePlaceholder("Store"),
};

const routeAliases = {
  "/": "/command-center",
  "/home": "/command-center",
  "/brand": "/brand-foundation",
};

function normalizePath(path) {
  const raw = String(path || "").trim();

  if (!raw) return "/command-center";

  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  return routeAliases[normalized] || normalized;
}

export function getPageComponent(path) {
  const normalizedPath = normalizePath(path);
  const component = pageRegistry[normalizedPath];

  if (!component) {
    console.warn(`[pageRegistry] No registered page for path: ${normalizedPath}`);
    return CommandCenterNext;
  }

  return component;
}

export function hasRegisteredPage(path) {
  const normalizedPath = normalizePath(path);
  return Boolean(pageRegistry[normalizedPath]);
}

export { pageRegistry, normalizePath };
export default pageRegistry;
