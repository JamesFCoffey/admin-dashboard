import graphqlDataPRovider, {
  GraphQLClient,
  liveProvider as graphqlLiveProvider,
} from '@refinedev/nestjs-query';
import type { BaseRecord } from '@refinedev/core';
import { createClient } from 'graphql-ws';
import type { Session } from 'next-auth';
import { getSession } from 'next-auth/react';
import { appConfig } from '@/utilities/config';
import { logger } from '@/utilities/logger';
import { fetchWrapper } from './fetch-wrapper';

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

const isUserNotFoundError = (error: unknown) => {
  if (!error) {
    return false;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : typeof (error as { message?: string }).message === 'string'
          ? (error as { message: string }).message
          : undefined;

  if (message && message.includes('Unable to find UserEntity with id')) {
    return true;
  }

  const maybeResponseErrors = (error as { response?: { errors?: Array<{ message?: string }> } })
    .response?.errors;
  if (
    maybeResponseErrors &&
    maybeResponseErrors.some((item) => item?.message?.includes('Unable to find UserEntity with id'))
  ) {
    return true;
  }

  return false;
};

const shouldCreateWsClient = typeof window !== 'undefined' && appConfig.featureFlags.realtime;

export const wsClient = shouldCreateWsClient
  ? createClient({
      url: WS_URL,
      lazy: true,
      connectionParams: async () => {
        const session = await getSession();
        const maybeUser = session?.user as
          | (Session['user'] & {
              accessToken?: string;
            })
          | undefined;

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
  logger.info('Realtime features disabled via configuration.');
}

export const dataProvider = (() => {
  const provider = graphqlDataPRovider(client);

  const enhancedProvider: typeof provider = {
    ...provider,
    getOne: async <TData extends BaseRecord = BaseRecord>(
      params: Parameters<typeof provider.getOne>[0],
    ) => {
      try {
        return await provider.getOne<TData>(params);
      } catch (error) {
        if (params.resource === 'users' && isUserNotFoundError(error)) {
          logger.warn('Returning placeholder for missing user', params.id);

          return {
            data: {
              id: params.id,
              name: 'Former team member',
              avatarUrl: null,
              email: '',
              phone: '',
              jobTitle: '',
            } as unknown as TData,
          };
        }

        throw error;
      }
    },
    getMany: async <TData extends BaseRecord = BaseRecord>(
      params: Parameters<typeof provider.getMany>[0],
    ) => {
      try {
        return await provider.getMany<TData>(params);
      } catch (error) {
        if (params.resource === 'users' && isUserNotFoundError(error)) {
          logger.warn('Returning placeholders for missing users', params.ids);

          const ids = Array.isArray(params.ids) ? params.ids : [];

          return {
            data: ids.map((id) => ({
              id,
              name: 'Former team member',
              avatarUrl: null,
              email: '',
              phone: '',
              jobTitle: '',
            })) as unknown as TData[],
          };
        }

        throw error;
      }
    },
  };

  return enhancedProvider;
})();
export const liveProvider =
  appConfig.featureFlags.realtime && wsClient
    ? (() => {
        const provider = graphqlLiveProvider(wsClient);
        return {
          ...provider,
          subscribe: (options: Parameters<typeof provider.subscribe>[0]) => {
            logger.debug('[liveProvider] subscribe', options);
            return provider.subscribe(options);
          },
        };
      })()
    : undefined;
