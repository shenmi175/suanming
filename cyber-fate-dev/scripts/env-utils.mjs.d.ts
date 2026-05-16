export const appDir: string;
export const rootDir: string;
export function ensureLocalEnvFiles(): void;
export function loadLocalEnv(): void;
export function separatedEnv(mode: string): NodeJS.ProcessEnv;
export function writeRuntimeConfig(env: NodeJS.ProcessEnv): void;
