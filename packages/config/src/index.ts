export const APP_NAME = 'Toqe';
export const APP_VERSION = process.env.npm_package_version ?? '0.0.0';

export type AppEnv = 'development' | 'staging' | 'production';

export function getAppEnv(): AppEnv {
  const env = process.env.NODE_ENV ?? process.env.APP_ENV ?? 'development';
  if (env === 'production') return 'production';
  if (env === 'staging') return 'staging';
  return 'development';
}

export function isDev(): boolean {
  return getAppEnv() === 'development';
}

export function isProd(): boolean {
  return getAppEnv() === 'production';
}
