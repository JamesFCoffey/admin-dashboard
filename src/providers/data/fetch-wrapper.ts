import { GraphQLFormattedError } from 'graphql';
import type { Session } from 'next-auth';
import { getSession } from 'next-auth/react';

type Error = {
  message: string;
  statusCode: string;
};

const resolveAccessToken = async () => {
  const session = await getSession();
  const maybeUser = session?.user as (Session['user'] & { accessToken?: string }) | undefined;
  return maybeUser?.accessToken;
};

const customFetch = async (url: string, options: RequestInit) => {
  const accessToken = await resolveAccessToken();

  const headers = new Headers(options.headers as HeadersInit);

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  headers.set('Content-Type', 'application/json');
  headers.set('Apollo-Require-Preflight', 'true');

  return await fetch(url, {
    ...options,
    headers,
  });
};

const shouldIgnoreError = (graphQLError?: GraphQLFormattedError | null) => {
  if (!graphQLError?.message) {
    return false;
  }

  return graphQLError.message.includes('Unable to find UserEntity with id');
};

const getGraphQLErrors = (
  body: Record<'errors', GraphQLFormattedError[] | undefined>,
): Error | null => {
  if (!body) {
    return {
      message: 'Unknown error',
      statusCode: 'INTERNAL_SERVER_ERROR',
    };
  }

  if ('errors' in body) {
    const errors = (body?.errors ?? []).filter((error) => !shouldIgnoreError(error));

    if (errors.length === 0) {
      return null;
    }

    const messages = errors.map((error) => error?.message).join('');
    const code = errors[0]?.extensions?.code;

    return {
      message: messages || JSON.stringify(errors),
      statusCode: code || 500,
    };
  }

  return null;
};

export const fetchWrapper = async (url: string, options: RequestInit) => {
  const response = await customFetch(url, options);

  const responseClone = response.clone();
  const body = await responseClone.json();

  const error = getGraphQLErrors(body);

  if (error) {
    throw error;
  }

  return response;
};
