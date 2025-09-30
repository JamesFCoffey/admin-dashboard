import type { AuthProvider } from '@refinedev/core';
import { getSession, signIn, signOut } from 'next-auth/react';

import { API_URL, dataProvider } from './data';

export const demoAuthEmail = 'michael.scott@dundermifflin.com';

export const authProvider: AuthProvider = {
  login: async ({ email, providerName, redirectTo }) => {
    const provider = providerName ?? (email ? 'credentials' : 'github');

    if (provider === 'credentials') {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        callbackUrl: redirectTo ?? '/',
      });

      if (result?.error) {
        return {
          success: false,
          error: {
            message: result.error,
            name: 'LoginError',
          },
        };
      }

      return {
        success: true,
        redirectTo: redirectTo ?? '/',
      };
    }

    await signIn(provider, {
      callbackUrl: redirectTo ?? '/',
    });

    return {
      success: true,
    };
  },
  logout: async () => {
    await signOut({ redirect: false, callbackUrl: '/login' });

    return {
      success: true,
      redirectTo: '/login',
    };
  },
  onError: async (error) => {
    if (error.statusCode === 'UNAUTHENTICATED') {
      await signOut({ redirect: false, callbackUrl: '/login' });

      return {
        logout: true,
      };
    }

    return { error };
  },
  check: async () => {
    const session = await getSession();

    if (process.env.NODE_ENV === 'development') {
      console.debug('authProvider.check session', session);
    }

    if (session?.user) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      redirectTo: '/login',
    };
  },
  getIdentity: async () => {
    try {
      const { data } = await dataProvider.custom<{ me: any }>({
        url: API_URL,
        method: 'post',
        headers: {},
        meta: {
          rawQuery: `
                    query Me {
                        me {
                            id,
                            name,
                            email,
                            phone,
                            jobTitle,
                            timezone
                            avatarUrl
                        }
                      }
                `,
        },
      });

      return data.me;
    } catch (error) {
      const session = await getSession();
      return session?.user ?? undefined;
    }
  },
};
