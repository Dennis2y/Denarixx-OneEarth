type ServerEnv = {
  PORT: number;
  DATABASE_URL: string;
  NODE_ENV: string;
};

function requireString(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function requirePort(name: string, value: string | undefined): number {
  const raw = requireString(name, value);
  const port = Number(raw);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid ${name}: "${raw}"`);
  }

  return port;
}

function requireDatabaseUrl(name: string, value: string | undefined): string {
  const url = requireString(name, value);

  if (!/^postgres(ql)?:\/\//i.test(url)) {
    throw new Error(`Invalid ${name}: must start with postgres:// or postgresql://`);
  }

  return url;
}

export const env: ServerEnv = {
  PORT: requirePort("PORT", process.env.PORT),
  DATABASE_URL: requireDatabaseUrl("DATABASE_URL", process.env.DATABASE_URL),
  NODE_ENV: process.env.NODE_ENV?.trim() || "development",
};
