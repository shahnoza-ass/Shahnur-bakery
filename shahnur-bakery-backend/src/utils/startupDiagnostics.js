function configError(code, message) {
  return Object.assign(new Error(message), { startupCode: code });
}

function validateEnvironment(env) {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) throw configError('JWT_SECRET', 'JWT_SECRET must contain at least 32 characters.');
  const uri = (env.MONGODB_URI || '').trim();
  if (!uri) throw configError('MONGODB_URI_MISSING', 'Set MONGODB_URI in Render Environment.');
  if (/<[^>]+>|\b(?:YANGI_PAROL|BAZA_USERNAME|PAROL)\b/i.test(uri)) {
    throw configError('MONGODB_URI_PLACEHOLDER', 'Replace the username/password placeholders in MONGODB_URI with the Atlas database credentials.');
  }
  if (!/^mongodb(?:\+srv)?:\/\//.test(uri)) throw configError('MONGODB_URI_FORMAT', 'MONGODB_URI must start with mongodb:// or mongodb+srv://.');
  if (env.TRUST_PROXY_HOPS && (!/^\d+$/.test(env.TRUST_PROXY_HOPS) || Number(env.TRUST_PROXY_HOPS) < 1 || Number(env.TRUST_PROXY_HOPS) > 10)) {
    throw configError('TRUST_PROXY_HOPS', 'Set TRUST_PROXY_HOPS to the trusted proxy count (1 on Render).');
  }
}

// Return controlled messages only: database errors can contain credentials or data.
function describeFailure(error) {
  if (error?.startupCode) return `${error.startupCode}: ${error.message}`;
  const message = String(error?.message || '');
  if ([18, 8000].includes(error?.code) || /authentication failed|bad auth|auth failed/i.test(message)) return 'MONGODB_AUTH: Check the Atlas Database Access username and password in Render MONGODB_URI.';
  if (/ENOTFOUND|querySrv|queryTxt|DNS/i.test(message)) return 'MONGODB_DNS: Check the Atlas cluster hostname in MONGODB_URI and that the cluster exists.';
  if (/MongoServerSelectionError|MongooseServerSelectionError|MongoNetworkError/.test(error?.name || '') || /ECONNREFUSED|ETIMEDOUT|IP whitelist|IP address|server selection/i.test(message)) return 'MONGODB_NETWORK: Check Atlas Network Access for the Render outbound IPs, cluster availability, and the connection hostname.';
  if (error?.code === 11000) return 'MONGODB_INDEX: Existing database records conflict with a unique index. Review the database before changing records.';
  if (/replica set kerak/i.test(message)) return 'MONGODB_REPLICA_SET: Use MongoDB Atlas or a replica set for orders.';
  if (/Frontend build missing/i.test(message)) return 'FRONTEND_BUILD: Run the frontend build before starting the production server.';
  if (error?.code === 'EADDRINUSE') return 'SERVER_PORT: The configured port is already in use.';
  return 'STARTUP_ERROR: Application initialization failed. Check the last startup stage and deployment configuration.';
}

module.exports = { validateEnvironment, describeFailure };
