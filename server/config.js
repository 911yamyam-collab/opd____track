// Configuration for the VALORANT tracker server
// Ports can be set via environment variables

export const config = {
  // Server port - can be overridden with PORT env variable
  serverPort: parseInt(process.env.PORT || '3001', 10),

  // Server host
  serverHost: process.env.HOST || '127.0.0.1',

  // Content cache TTL in milliseconds (1 hour by default)
  contentCacheTTL: parseInt(process.env.CONTENT_CACHE_TTL || String(60 * 60 * 1000), 10),

  // CORS allowed origins
  corsAllowedOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173'
      ]
};
