import { CyberFateReportSchema, type CyberFateReport } from "@/lib/report/reportSchema";

const defaultBackendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || process.env.BACKEND_PORT || "4000";

declare global {
  interface Window {
    __CYBER_FATE_CONFIG__?: {
      apiBaseUrl?: string;
      backendPort?: string;
    };
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

export function browserBackendApiBaseUrl() {
  if (typeof window !== "undefined") {
    const runtimeBaseUrl = window.__CYBER_FATE_CONFIG__?.apiBaseUrl?.trim();
    if (runtimeBaseUrl) return trimTrailingSlash(runtimeBaseUrl);
  }

  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) return trimTrailingSlash(configured);

  if (typeof window !== "undefined") {
    const runtimeBackendPort = window.__CYBER_FATE_CONFIG__?.backendPort || defaultBackendPort;
    return `${window.location.protocol}//${window.location.hostname}:${runtimeBackendPort}`;
  }

  return `http://localhost:${defaultBackendPort}`;
}

export function serverBackendApiBaseUrl() {
  const configured = process.env.BACKEND_API_BASE_URL?.trim();
  if (configured) return trimTrailingSlash(configured);
  return `http://127.0.0.1:${process.env.BACKEND_PORT || defaultBackendPort}`;
}

export function backendApiUrl(pathname: string, runtime: "browser" | "server" = "browser") {
  const baseUrl = runtime === "server" ? serverBackendApiBaseUrl() : browserBackendApiBaseUrl();
  return `${baseUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

async function readErrorMessage(response: Response) {
  const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null;
  return payload?.message || payload?.error || `Backend API ${response.status}`;
}

export async function getReportFromBackend(id: string): Promise<CyberFateReport | null> {
  const response = await fetch(backendApiUrl(`/api/reports/${encodeURIComponent(id)}`, "server"), {
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await readErrorMessage(response));

  return CyberFateReportSchema.parse(await response.json());
}
