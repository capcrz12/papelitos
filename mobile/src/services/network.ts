import Constants from "expo-constants";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const getExpoHostIp = (): string | null => {
  const hostCandidates = [
    Constants.expoConfig?.hostUri,
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri,
    (Constants as any)?.manifest?.debuggerHost,
  ];

  for (const candidate of hostCandidates) {
    if (!candidate || typeof candidate !== "string") continue;
    const host = candidate.split(":")[0]?.trim();
    if (host && !LOCAL_HOSTS.has(host)) {
      return host;
    }
  }

  return null;
};

const replaceLocalhostHost = (inputUrl: string): string => {
  try {
    const parsed = new URL(inputUrl);
    if (!LOCAL_HOSTS.has(parsed.hostname)) {
      return inputUrl;
    }

    const expoHostIp = getExpoHostIp();
    if (!expoHostIp) {
      return inputUrl;
    }

    parsed.hostname = expoHostIp;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return inputUrl;
  }
};

export const resolveApiBaseUrl = (envApiUrl?: string): string => {
  const base = envApiUrl || "http://localhost:8000/api";
  return replaceLocalhostHost(base);
};

export const resolveWsBaseUrl = (
  envWsUrl: string | undefined,
  apiBaseUrl: string,
): string => {
  const fallbackFromApi = apiBaseUrl.replace(/\/api\/?$/, "");
  const base = envWsUrl || fallbackFromApi || "http://localhost:8000";
  return replaceLocalhostHost(base);
};
