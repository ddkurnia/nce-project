import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import config from './config/environment.js';
import authRoutes from './routes/authRoutes.js';
import commodityRoutes from './routes/commodityRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import userRoutes from './routes/userRoutes.js';

// ─── Initialize Firebase & Cloudinary ───────────────────────────────────────
// These modules self-initialize on import. Importing here ensures they are
// ready before any request handler tries to use them.
import './config/firebase.js';
import './config/cloudinary.js';

// ─── Express App ────────────────────────────────────────────────────────────
const app = express();

// ─── Security & Compression Middleware ───────────────────────────────────────
app.use(helmet());
app.use(compression());

// ─── CORS ───────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = config.cors.origin
      .split(',')
      .map((o) => o.trim());

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours preflight cache
};
app.use(cors(corsOptions));

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});
app.use('/api', limiter);

// ─── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HTTP Request Logging ───────────────────────────────────────────────────
if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms', {
      skip: (req) => req.url === '/api/health',
    })
  );
}

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/commodities', commodityRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/users', userRoutes);

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Nusantara Commodity Exchange API is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: '1.0.0',
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Catch-all for non-API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Error]', {
    message: err.message,
    stack: config.isDevelopment ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  // CORS error
  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  // Multer file-size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File size exceeds the allowed limit.',
    });
  }

  // Firebase Auth errors
  if (err.code && err.code.startsWith('auth/')) {
    const statusMap = {
      'auth/id-token-expired': 401,
      'auth/id-token-revoked': 401,
      'auth/invalid-id-token': 401,
      'auth/user-not-found': 404,
      'auth/email-already-exists': 409,
    };
    const status = statusMap[err.code] || 400;
    return res.status(status).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // Firestore errors
  if (err.code && err.code.startsWith('NOT_FOUND')) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found.',
    });
  }

  // Default: 500 Internal Server Error
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: statusCode === 500 && !config.isDevelopment
      ? 'Internal server error'
      : err.message,
  };

  if (config.isDevelopment) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

// ─── Start Server ───────────────────────────────────────────────────────────
const server = app.listen(config.port, () => {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Nusantara Commodity Exchange (NCE) API Server     ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║   Environment : ${config.env.padEnd(36)} ║`);
  console.log(`║   Port         : ${String(config.port).padEnd(36)} ║`);
  console.log(`║   CORS Origin  : ${config.cors.origin.padEnd(36)} ║`);
  console.log('╚══════════════════════════════════════════════════════╝');
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`\n[Shutdown] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Shutdown] HTTP server closed.');
    process.exit(0);
  });

  // Force-close after 10 seconds if connections are still active
  setTimeout(() => {
    console.error(
      '[Shutdown] Could not close connections in time. Forcefully shutting down.'
    );
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Unhandled Rejection / Exception ────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception]', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export default app;
