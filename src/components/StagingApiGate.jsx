import React from "react";
import { getApiBaseUrl, isStagingApi } from "../lib/apiConfig";

export default function StagingApiGate({ children }) {
  if (isStagingApi) {
    try {
      getApiBaseUrl();
    } catch {
      return (
        <main role="alert" className="min-h-screen bg-[#efe7e3] px-6 py-12 text-[#2b1040]">
          <h1>This staging build is missing its API configuration</h1>
        </main>
      );
    }
  }
  return children;
}
