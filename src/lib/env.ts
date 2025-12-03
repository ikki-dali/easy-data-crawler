import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // Auth
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  
  // Google Ads (optional - can use same as above)
  GOOGLE_ADS_CLIENT_ID: z.string().optional(),
  GOOGLE_ADS_CLIENT_SECRET: z.string().optional(),
  GOOGLE_ADS_DEVELOPER_TOKEN: z.string().optional(),
  
  // Meta (optional)
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  
  // TikTok (optional)
  TIKTOK_APP_ID: z.string().optional(),
  TIKTOK_APP_SECRET: z.string().optional(),
  
  // X/Twitter (optional)
  X_API_KEY: z.string().optional(),
  X_API_SECRET: z.string().optional(),
  
  // LINE (optional)
  LINE_CLIENT_ID: z.string().optional(),
  LINE_CLIENT_SECRET: z.string().optional(),
  
  // Encryption
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be exactly 64 hex characters'),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    
    // In development, just warn
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Running in development mode with invalid env vars');
      return process.env as unknown as Env;
    }
    
    throw new Error('Invalid environment variables');
  }
  
  return parsed.data;
}

export const env = validateEnv();

// Helper to check if a platform is configured
export function isPlatformConfigured(platform: string): boolean {
  switch (platform) {
    case 'GOOGLE_SHEETS':
    case 'GOOGLE_ADS':
      return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
    case 'META_ADS':
      return !!(env.META_APP_ID && env.META_APP_SECRET);
    case 'TIKTOK_ADS':
      return !!(env.TIKTOK_APP_ID && env.TIKTOK_APP_SECRET);
    case 'X_ADS':
      return !!(env.X_API_KEY && env.X_API_SECRET);
    case 'LINE_ADS':
      return !!(env.LINE_CLIENT_ID && env.LINE_CLIENT_SECRET);
    default:
      return false;
  }
}

