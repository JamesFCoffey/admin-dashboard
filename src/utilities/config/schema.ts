import { z } from "zod";

export const FeatureFlagsSchema = z.object({
  realtime: z.boolean().default(true),
});

export const AppConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  graphqlUrl: z.string().url(),
  graphqlWsUrl: z.string().url(),
  oauthProviders: z.array(z.string()).default([]),
  featureFlags: FeatureFlagsSchema.default({ realtime: true }),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
