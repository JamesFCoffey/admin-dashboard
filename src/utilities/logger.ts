type LogFn = (message: string, ...optionalParams: unknown[]) => void;

const withPrefix = (level: string, fn: LogFn): LogFn => {
  return (message, ...optionalParams) => {
    fn(`[admin-dashboard:${level}] ${message}`, ...optionalParams);
  };
};

export const logger = {
  info: withPrefix("info", console.info),
  warn: withPrefix("warn", console.warn),
  error: withPrefix("error", console.error),
  debug: withPrefix("debug", console.debug),
};

export const formatConfigError = (missingKeys: string[]) =>
  `Missing required environment variable${missingKeys.length > 1 ? "s" : ""}: ${missingKeys.join(", ")}`;
