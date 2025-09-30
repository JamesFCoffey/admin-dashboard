import NextAuth from 'next-auth';
import type { Account, NextAuthOptions, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { randomBytes } from 'node:crypto';

import { logger } from '@/utilities/logger';
import { appConfig } from '@/utilities/config';

const LOGIN_MUTATION = `
  mutation Login($email: String!) {
    login(loginInput: { email: $email }) {
      accessToken
    }
  }
`;

const REGISTER_MUTATION = `
  mutation Register($email: String!, $password: String!) {
    register(registerInput: { email: $email, password: $password }) {
      id
      email
    }
  }
`;

const UPDATE_USER_MUTATION = `
  mutation UpdateUser($id: ID!, $name: String) {
    updateOneUser(
      input: { id: $id, update: { name: $name } }
    ) {
      id
      name
    }
  }
`;

const ME_QUERY = `
  query Me {
    me {
      id
      name
      email
    }
  }
`;

const buildJitWhitelist = () => {
  const entries = (process.env.OAUTH_JIT_WHITELIST ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  const emails = new Set<string>();
  const domains = new Set<string>();

  entries.forEach((entry) => {
    if (entry.startsWith('@') && entry.length > 1) {
      domains.add(entry.slice(1));
    } else {
      emails.add(entry);
    }
  });

  return { emails, domains };
};

const { emails: jitEmails, domains: jitDomains } = buildJitWhitelist();

const isWhitelistedForProvisioning = (email: string) => {
  const normalized = email.toLowerCase();
  if (jitEmails.has(normalized)) return true;

  const domain = normalized.split('@')[1];
  if (!domain) return false;

  return jitDomains.has(domain);
};

const fetchAccessToken = async (email: string) => {
  const response = await fetch(appConfig.graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Apollo-Require-Preflight': 'true',
    },
    body: JSON.stringify({
      query: LOGIN_MUTATION,
      variables: { email },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Login request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: { login?: { accessToken?: string | null } };
    errors?: Array<{ message?: string }>;
  };

  const accessToken = payload.data?.login?.accessToken;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('\n'));
  }

  if (!accessToken) {
    throw new Error('Authentication service did not return an access token');
  }

  return accessToken;
};

type RegisterResult = {
  id: string;
  email: string;
} | null;

const registerUser = async (email: string): Promise<RegisterResult> => {
  if (!isWhitelistedForProvisioning(email)) {
    throw new Error(
      `Automatic provisioning not permitted for ${email}. Add the address to OAUTH_JIT_WHITELIST to allow self-registration.`,
    );
  }

  const password = randomBytes(12).toString('base64');

  const response = await fetch(appConfig.graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Apollo-Require-Preflight': 'true',
    },
    body: JSON.stringify({
      query: REGISTER_MUTATION,
      variables: { email, password },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`User registration failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: { register?: { id: string; email: string } | null };
    errors?: Array<{ message?: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('\n'));
  }

  const registeredUser = payload.data?.register;

  if (!registeredUser?.email || !registeredUser?.id) {
    throw new Error('CRM did not return a registered user record.');
  }

  logger.info(`Provisioned CRM user ${registeredUser.email} via OAuth just-in-time registration.`);

  return registeredUser;
};

const updateUserProfile = async (
  userId: string,
  accessToken: string,
  profile: { name?: string },
) => {
  if (!profile.name) return;

  try {
    await fetch(appConfig.graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Apollo-Require-Preflight': 'true',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query: UPDATE_USER_MUTATION,
        variables: {
          id: userId,
          name: profile.name,
        },
      }),
      cache: 'no-store',
    });
  } catch (error) {
    logger.warn(`Failed to update CRM profile for ${userId}. User will keep default name.`, error);
  }
};

const fetchCurrentUser = async (accessToken: string) => {
  const response = await fetch(appConfig.graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Apollo-Require-Preflight': 'true',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query: ME_QUERY }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch current user profile. Status ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: { me?: { id: string; name?: string; email: string } | null };
    errors?: Array<{ message?: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('\n'));
  }

  return payload.data?.me ?? null;
};

const ensureUserProfile = async (accessToken: string, profile: { name?: string }) => {
  if (!profile?.name) return;

  try {
    const currentUser = await fetchCurrentUser(accessToken);
    if (!currentUser?.id) return;

    if ((currentUser.name ?? '').trim() === profile.name.trim()) {
      return;
    }

    await updateUserProfile(currentUser.id, accessToken, profile);
  } catch (error) {
    logger.warn('Failed to synchronize CRM profile name after login', error);
  }
};

const exchangeAccessToken = async (email: string, profile?: { name?: string }) => {
  try {
    const token = await fetchAccessToken(email);
    await ensureUserProfile(token, profile ?? {});
    return { token, emailUsed: email } as const;
  } catch (error) {
    if (error instanceof Error && /not found/i.test(error.message)) {
      const registeredUser = await registerUser(email);
      const token = await fetchAccessToken(email);

      if (registeredUser) {
        await updateUserProfile(registeredUser.id, token, {
          name: profile?.name,
        });
      }

      return { token, emailUsed: email } as const;
    }

    throw error;
  }
};

const providers: NextAuthOptions['providers'] = [];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  );
} else {
  logger.warn(
    'GitHub OAuth credentials missing. Set GITHUB_ID and GITHUB_SECRET to enable GitHub login.',
  );
}

providers.push(
  Credentials({
    id: 'credentials',
    name: 'Demo Credentials',
    credentials: {
      email: { label: 'Email', type: 'email', placeholder: 'name@example.com' },
    },
    async authorize(credentials) {
      const email = credentials?.email?.toString().trim();

      if (!email) {
        throw new Error('Email is required');
      }

      const { token, emailUsed } = await exchangeAccessToken(email);

      return {
        id: email,
        email,
        apiAccessToken: token,
        crmEmail: emailUsed,
      } as const;
    },
  }),
);

if (providers.length === 0) {
  throw new Error('At least one authentication provider must be configured for NextAuth.');
}

const authConfig: NextAuthOptions = {
  providers,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({
      token,
      user,
      account,
    }: {
      token: JWT;
      user?: User | null;
      account?: Account | null;
    }) {
      if (user) {
        token.sub = token.sub ?? user.id;
        token.email = user.email ?? token.email;
        if (user.name) {
          (token as typeof token & { profileName?: string }).profileName = user.name;
        }

        const maybeToken = (user as { apiAccessToken?: string }).apiAccessToken;
        const maybeCrmEmail = (user as { crmEmail?: string }).crmEmail;

        if (maybeToken) {
          token.apiAccessToken = maybeToken;
          if (maybeCrmEmail) {
            (token as typeof token & { apiAccessEmail?: string }).apiAccessEmail = maybeCrmEmail;
          }
        } else if (user.email && (!token.apiAccessToken || account)) {
          try {
            const { token: apiToken, emailUsed } = await exchangeAccessToken(user.email, {
              name: user.name ?? undefined,
            });
            token.apiAccessToken = apiToken;
            (token as typeof token & { apiAccessEmail?: string }).apiAccessEmail = emailUsed;
          } catch (error) {
            logger.error('Failed to exchange OAuth profile for API access', error);
            throw error;
          }
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        const sessionUser = session.user as typeof session.user & {
          id?: string;
          accessToken?: string;
          crmEmail?: string;
        };

        sessionUser.id = sessionUser.id ?? (token.sub as string | undefined);
        sessionUser.email = sessionUser.email ?? (token.email as string | undefined);

        if (token.apiAccessToken) {
          sessionUser.accessToken = token.apiAccessToken as string;
        }

        const accessEmail = (token as typeof token & { apiAccessEmail?: string }).apiAccessEmail;

        if (accessEmail) {
          sessionUser.crmEmail = accessEmail;
        }

        const profileName = (token as typeof token & { profileName?: string }).profileName;
        if (profileName && !sessionUser.name) {
          sessionUser.name = profileName;
        }
      }

      logger.debug(
        'session callback resolved',
        JSON.stringify({ hasUser: !!session.user, accessEmail: (token as any).apiAccessEmail }),
      );

      return session;
    },
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
