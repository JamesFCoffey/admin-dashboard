import graphqlDataPRovider, {
  GraphQLClient,
  liveProvider as graphqlLiveProvider,
} from "@refinedev/nestjs-query";
import { createClient } from "graphql-ws";
import { getSession } from "next-auth/react";
import { appConfig } from "@/utilities/config";
import { logger } from "@/utilities/logger";
import { fetchWrapper } from "./fetch-wrapper";

export const API_BASE_URL = appConfig.apiBaseUrl;
export const API_URL = appConfig.graphqlUrl;
export const WS_URL = appConfig.graphqlWsUrl;

export const client = new GraphQLClient(API_URL, {
  fetch: (url: string, options: RequestInit) => {
    try {
      return fetchWrapper(url, options);
    } catch (error) {
      return Promise.reject(error as Error);
    }
  },
});

const shouldCreateWsClient =
  typeof window !== "undefined" && appConfig.featureFlags.realtime;

export const wsClient = shouldCreateWsClient
  ? createClient({
      url: WS_URL,
      lazy: true,
      connectionParams: async () => {
        const session = await getSession();
        const maybeUser = session?.user as (typeof session.user & {
          accessToken?: string;
        }) | null;

        if (!maybeUser?.accessToken) {
          return {};
        }

        return {
          headers: {
            Authorization: `Bearer ${maybeUser.accessToken}`,
          },
        };
      },
    })
  : undefined;

if (!appConfig.featureFlags.realtime) {
  logger.info("Realtime features disabled via configuration.");
}

export const dataProvider = graphqlDataPRovider(client);
export const liveProvider =
  appConfig.featureFlags.realtime && wsClient
    ? graphqlLiveProvider(wsClient)
    : undefined;
