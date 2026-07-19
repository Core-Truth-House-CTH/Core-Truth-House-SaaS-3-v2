// Lightweight ESLint guard (flat config, ESLint v9).
// Purpose: fail the build when an identifier or JSX component is undefined
// (e.g. the <TrustedStrip /> bug that crashed the blog article pages).
// Intentionally minimal — only the two "undefined" rules are enabled so it
// does not flag unrelated style issues on existing code.

import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  {
    files: ["src/**/*.{js,jsx,mjs}"],
    // Existing exhaustive-deps disable comments are for the full project lint,
    // not this focused guard — don't report them as unused here.
    linterOptions: { reportUnusedDisableDirectives: "off" },
    // react-hooks is registered (not enabled) only so existing
    // `// eslint-disable-next-line react-hooks/exhaustive-deps` comments resolve.
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "no-undef": "error",
      "react/jsx-no-undef": "error",
    },
  },
];
