import { AppConfig, AppConfigSchema } from "./schema";
import { formatConfigError, logger } from "@/utilities/logger";

const DEFAULTS = {
  apiBaseUrl: "https://api.crm.refine.dev",
  graphqlPath: "/graphql",
};

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const buildGraphqlUrl = (baseUrl: string, provided: string | undefined) => {
  if (provided) return provided;
  return `${baseUrl}${DEFAULTS.graphqlPath}`;
};

const buildGraphqlWsUrl = (baseUrl: string, provided: string | undefined) => {
  if (provided) return provided;
  try {
    const url = new URL(baseUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = DEFAULTS.graphqlPath;
    return url.toString();
  } catch (error) {
    throw new Error(
      `Invalid base URL provided for GraphQL websocket endpoint: ${baseUrl}`,
    );
  }
};

const parseOauthProviders = (value: string | undefined) => {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_GRAPHQL_URL",
  "NEXT_PUBLIC_GRAPHQL_WS_URL",
];

const collectConfig = (): AppConfig => {
  const rawApiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL;
  const rawGraphqlUrl =
    process.env.NEXT_PUBLIC_GRAPHQL_URL ?? process.env.GRAPHQL_URL;
  const rawGraphqlWsUrl =
    process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ?? process.env.GRAPHQL_WS_URL;
  const rawOauthProviders =
    process.env.NEXT_PUBLIC_OAUTH_PROVIDERS ?? process.env.OAUTH_PROVIDERS;
  const rawRealtimeFlag =
    process.env.NEXT_PUBLIC_ENABLE_REALTIME ?? process.env.ENABLE_REALTIME;

  const missingKeys: string[] = [];

  const apiBaseUrl = rawApiBaseUrl ?? DEFAULTS.apiBaseUrl;
  const isUsingDefaultBase = !rawApiBaseUrl;
  if (isUsingDefaultBase) {
    missingKeys.push("NEXT_PUBLIC_API_BASE_URL");
  }

  const graphqlUrl = buildGraphqlUrl(apiBaseUrl, rawGraphqlUrl ?? undefined);
  if (!rawGraphqlUrl && isUsingDefaultBase) {
    missingKeys.push("NEXT_PUBLIC_GRAPHQL_URL");
  }

  const graphqlWsUrl = buildGraphqlWsUrl(
    apiBaseUrl,
    rawGraphqlWsUrl ?? undefined,
  );
  if (!rawGraphqlWsUrl && isUsingDefaultBase) {
    missingKeys.push("NEXT_PUBLIC_GRAPHQL_WS_URL");
  }

  const featureFlags = {
    realtime: parseBoolean(rawRealtimeFlag ?? undefined, true),
  };

  const oauthProviders = parseOauthProviders(rawOauthProviders ?? undefined);

  if (missingKeys.length) {
    const message = formatConfigError(missingKeys);
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }
    logger.warn(`${message}. Falling back to baked-in defaults for development.`);
  }

  const result = AppConfigSchema.safeParse({
    apiBaseUrl,
    graphqlUrl,
    graphqlWsUrl,
    oauthProviders,
    featureFlags,
  });

  if (!result.success) {
    throw result.error;
  }

  return result.data;
};

export const appConfig: AppConfig = collectConfig();

export type { AppConfig };
