import React from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCircle,
  LayoutGrid,
  Video,
  FileOutput,
  MessageCircle,
  Package,
  Mic,
  ArrowRight,
} from "lucide-react";

import { DashboardLayout } from "../components/Layout";

// Standalone creative tools. Banners use --cth-command-* gradients only; the
// available/coming badges use --cth-command-success / --cth-command-ink.
const TOOLS = [
  {
    name: "AI Headshot Generator",
    desc: "Generate professional headshots and brand portraits using your identity style. Upload a photo and let your brand context do the rest.",
    tier: "Foundation+",
    available: true,
    to: "/studios/headshot",
    icon: UserCircle,
    banner: "linear-gradient(135deg, var(--cth-command-purple), var(--cth-command-crimson))",
  },
  {
    name: "Visual Studio",
    desc: "Generate on-brand social graphics, cover images, and brand visuals using your stored colors, fonts, and logos.",
    tier: "House+",
    available: true,
    to: "/studios/visual",
    icon: LayoutGrid,
    banner: "linear-gradient(135deg, var(--cth-command-night), var(--cth-command-purple))",
  },
  {
    name: "Video Studio",
    desc: "Generate branded short-form videos from a script, prompt, and reference image. Your face, your brand, your message — as video.",
    tier: "House+",
    available: true,
    to: "/studios/video",
    icon: Video,
    banner: "linear-gradient(135deg, var(--cth-command-cinnabar), var(--cth-command-ink))",
  },
  {
    name: "Voice Studio",
    desc: "Generate professional AI voiceovers from your scripts. Choose from a library of voices and export studio-quality audio.",
    tier: "Foundation+",
    available: true,
    to: "/studios/voice",
    icon: Mic,
    banner: "linear-gradient(135deg, var(--cth-command-crimson), var(--cth-command-ink))",
  },
  {
    name: "Brand Kit Studio",
    desc: "Export a polished brand kit PDF using your Identity Studio data — colors, fonts, logo, and usage rules in one shareable document.",
    tier: "House+",
    available: false,
    icon: FileOutput,
    banner: "linear-gradient(135deg, var(--cth-command-ink), var(--cth-command-night))",
  },
  {
    name: "Bio Generator Studio",
    desc: "Generate your professional brand bio in multiple formats — LinkedIn, speaker intro, website about page — from your Foundation data.",
    tier: "Foundation+",
    available: true,
    to: "/studios/bio",
    icon: MessageCircle,
    banner: "linear-gradient(135deg, var(--cth-command-crimson), var(--cth-command-cinnabar))",
  },
  {
    name: "Offer Page Studio",
    desc: "Generate a polished one-page offer overview from your Offer Builder data. Ready to use as a sales page draft or leave-behind.",
    tier: "Structure+",
    available: false,
    icon: Package,
    banner: "linear-gradient(135deg, var(--cth-command-purple-mid), var(--cth-command-ink))",
  },
  {
    name: "Brand Voice Studio",
    desc: "Generate a brand voice guide document using your Messaging Structure data. Rules, tone examples, and what to avoid.",
    tier: "Structure+",
    available: false,
    icon: Mic,
    banner: "linear-gradient(135deg, var(--cth-command-ink), var(--cth-command-purple))",
  },
];

const slug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function Studios() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <header className="cth-page-header">
        <div className="min-w-0 flex-1">
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 600,
              color: "var(--cth-command-ink)",
              fontSize: "clamp(24px, 4vw, 32px)",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Studios
          </h1>
          <p
            style={{
              margin: "6px 0 0 0",
              fontSize: 13,
              color: "var(--cth-command-muted)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Standalone creative tools that turn your brand infrastructure into market-ready visuals.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const clickable = tool.available;

            return (
              <div
                key={tool.name}
                data-testid={`studio-card-${slug(tool.name)}`}
                onClick={() => clickable && navigate(tool.to)}
                role={clickable ? "button" : undefined}
                style={{
                  background: "var(--cth-command-panel)",
                  border: "0.5px solid var(--cth-command-border)",
                  borderRadius: 14,
                  overflow: "hidden",
                  cursor: clickable ? "pointer" : "default",
                  opacity: clickable ? 1 : 0.65,
                }}
              >
                <div
                  style={{
                    height: 110,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    background: tool.banner,
                  }}
                >
                  <Icon size={32} style={{ color: "var(--cth-command-ivory)", opacity: 0.85 }} />
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      fontSize: 9,
                      fontWeight: 500,
                      padding: "3px 9px",
                      borderRadius: 20,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      ...(tool.available
                        ? {
                            background: "var(--cth-command-success)",
                            color: "var(--cth-command-ivory)",
                          }
                        : {
                            background: "var(--cth-command-ink)",
                            color: "var(--cth-command-ivory)",
                            border: "0.5px solid var(--cth-command-border)",
                          }),
                    }}
                  >
                    {tool.available ? "Available" : "Coming Soon"}
                  </span>
                </div>

                <div style={{ padding: "14px 16px" }}>
                  <div
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: 17,
                      fontWeight: 500,
                      color: "var(--cth-command-ink)",
                      marginBottom: 4,
                    }}
                  >
                    {tool.name}
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--cth-command-muted)",
                      lineHeight: 1.5,
                      marginBottom: 10,
                    }}
                  >
                    {tool.desc}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--cth-command-muted)",
                        fontWeight: 500,
                      }}
                    >
                      {tool.tier}
                    </span>
                    {tool.available ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: "var(--cth-command-crimson)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        Open <ArrowRight size={10} />
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: "var(--cth-command-muted)",
                        }}
                      >
                        Coming soon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </DashboardLayout>
  );
}
