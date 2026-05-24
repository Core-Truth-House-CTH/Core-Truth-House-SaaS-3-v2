import React from "react";

export default function PlaceholderPage({ title }) {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--cth-command-blush)" }}
    >
      <h1
        className="font-serif text-3xl font-bold text-center sm:text-4xl"
        style={{ color: "var(--cth-command-ink)" }}
      >
        {title}
      </h1>
      <p
        className="mt-3 text-sm"
        style={{ color: "var(--cth-command-muted)" }}
      >
        Coming soon
      </p>
    </main>
  );
}
