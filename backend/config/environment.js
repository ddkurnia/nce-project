import dotenv from 'dotenv';

dotenv.config();

/**
 * Validates that a required environment variable is set.
 * Throws a descriptive error in production if missing.
 * In non-production environments, returns a placeholder so the app can still start.
 */
const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `FATAL: Missing required environment variable "${key}". ` +
        `Please set it in your .env file or deployment environment.`
      );
    }
    console.warn(
      `[ENV WARNING] Missing environment variable "${key}". ` +
      `Using empty placeholder in non-production mode.`
    );
    return '';
  }
  return value;
};

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',

  port: parseInt(process.env.PORT || '3001', 10),

  firebase: {
    projectId: requireEnv('FIREBASE_PROJECT_ID'),
    privateKey: requireEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    clientEmail: requireEnv('FIREBASE_CLIENT_EMAIL'),
  },

  cloudinary: {
    cloudName: requireEnv('CLOUDINARY_CLOUD_NAME'),
    apiKey: requireEnv('CLOUDINARY_API_KEY'),
    apiSecret: requireEnv('CLOUDINARY_API_SECRET'),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5500',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
};

Object.freeze(config);

export default config;
