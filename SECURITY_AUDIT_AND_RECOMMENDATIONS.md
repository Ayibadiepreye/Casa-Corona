# 🔒 Security Audit & Recommendations for Casa Corona

**Generated:** 2026-07-14  
**Status:** Security assessment and hardening guide

---

## 📊 Current Security Status

### ✅ What's Already Good

1. **Authentication & Authorization**
   - ✅ JWT-based authentication with access + refresh tokens
   - ✅ Role-based access control (RBAC)
   - ✅ Account lockout after failed login attempts (5 attempts, 30min lockout)
   - ✅ Bcrypt password hashing (12 rounds)
   - ✅ OAuth integration (Google)

2. **Rate Limiting**
   - ✅ General API rate limiting (100 req/15min)
   - ✅ Auth endpoint rate limiting (10 req/15min)
   - ✅ Per-account failed login tracking with Redis

3. **Input Validation & Sanitization**
   - ✅ Zod schema validation on all endpoints
   - ✅ DOMPurify for HTML sanitization
   - ✅ Drizzle ORM (prevents SQL injection via parameterized queries)

4. **Security Headers**
   - ✅ Helmet.js enabled
   - ✅ CORS configured with whitelist
   - ✅ `x-powered-by` header disabled
   - ✅ Cookie-based auth with httpOnly

5. **Infrastructure**
   - ✅ HTTPS enforced (via Render)
   - ✅ Environment variables for secrets
   - ✅ Logging with Pino
   - ✅ Maintenance mode support

---

## 🚨 Critical Security Improvements Needed

### 1. **HTTPS & Cookie Security** ⚠️ HIGH PRIORITY

**Issue:** Cookies not properly secured for production

**Current Risk:**
- Cookies can be intercepted over HTTP
- No CSRF protection
- Session hijacking vulnerability

**Fix:**

**File:** `apps/api/src/lib/jwt.ts`

Add secure cookie settings:

```typescript
export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProduction = env.NODE_ENV === 'production';
  
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction, // Only over HTTPS in production
    sameSite: 'strict', // CSRF protection
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  });
  
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth/refresh', // Restrict to refresh endpoint only
  });
}
```

---

### 2. **Add CSRF Protection** ⚠️ HIGH PRIORITY

**Issue:** No CSRF token validation for state-changing operations

**Fix:**

Install package:
```bash
pnpm add csurf cookie-parser
```

**File:** `apps/api/src/app.ts` (add after cookieParser):

```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Apply CSRF to state-changing routes (skip for GET, HEAD, OPTIONS)
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  // Skip CSRF for webhook endpoints (they use signature verification)
  if (req.path.includes('/webhook')) {
    return next();
  }
  return csrfProtection(req, res, next);
});

// Endpoint to get CSRF token
app.get('/api/v1/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

---

### 3. **Improve Helmet Configuration** ⚠️ MEDIUM PRIORITY

**Issue:** Helmet security headers are too permissive

**File:** `apps/api/src/app.ts`

Replace current helmet config with:

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for Cloudinary
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  })
);
```

---

### 4. **Add Request Size Limits** ⚠️ MEDIUM PRIORITY

**Issue:** No protection against large payload DoS attacks

**File:** `apps/api/src/app.ts`

Update JSON parser:

```typescript
// Replace current line with:
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook signature verification
    if (req.url.includes('/webhook')) {
      (req as any).rawBody = buf.toString();
    }
  }
}));

// Add URL-encoded parser
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));
```

---

### 5. **Enhance Password Security** ⚠️ MEDIUM PRIORITY

**Issue:** No password strength requirements enforced

**File:** `apps/api/src/modules/auth/auth.schema.ts`

Add password validation:

```typescript
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[a-z]/, "Password must contain lowercase letter")
  .regex(/[A-Z]/, "Password must contain uppercase letter")
  .regex(/[0-9]/, "Password must contain number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain special character");

export const signupSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().min(2).max(100),
  role: z.enum(['customer', 'vendor']).default('customer'),
});
```

---

### 6. **Add Security Monitoring** ⚠️ MEDIUM PRIORITY

**Issue:** No alerting for suspicious activity

**Create:** `apps/api/src/lib/security-monitor.ts`

```typescript
import { logger } from './logger.js';

interface SecurityEvent {
  type: 'failed_login' | 'account_locked' | 'suspicious_request' | 'rate_limit_exceeded';
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
}

export function logSecurityEvent(event: SecurityEvent) {
  logger.warn({
    security: true,
    ...event,
    timestamp: new Date().toISOString(),
  }, `Security event: ${event.type}`);
  
  // TODO: Send alerts to admin if threshold exceeded
  // e.g., >10 failed logins in 5 minutes from same IP
}

export function detectSuspiciousActivity(req: any): boolean {
  const suspicious = [
    // SQL injection attempts
    /(\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b)/i,
    // XSS attempts
    /<script[^>]*>.*?<\/script>/i,
    // Path traversal
    /\.\.[\/\\]/,
    // Command injection
    /[;&|`$]/,
  ];
  
  const checkString = JSON.stringify(req.body) + JSON.stringify(req.query);
  return suspicious.some(pattern => pattern.test(checkString));
}
```

Use in routes:

```typescript
import { logSecurityEvent, detectSuspiciousActivity } from '../../lib/security-monitor.js';

router.post('/login', authLimiter, (req, res, next) => {
  if (detectSuspiciousActivity(req)) {
    logSecurityEvent({
      type: 'suspicious_request',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { path: req.path, body: req.body },
    });
    return res.status(400).json({ error: 'Invalid request' });
  }
  next();
}, validate({ body: loginSchema }), authController.login);
```

---

### 7. **Secure File Uploads** ⚠️ HIGH PRIORITY

**Issue:** No file type verification beyond extension checking

**File:** `apps/api/src/lib/upload.ts`

Add magic number validation:

```typescript
import { fileTypeFromBuffer } from 'file-type';

export async function validateFileType(buffer: Buffer, allowedTypes: string[]): Promise<boolean> {
  const type = await fileTypeFromBuffer(buffer);
  
  if (!type) {
    return false; // Couldn't determine file type
  }
  
  return allowedTypes.includes(type.mime);
}

// Update upload handler:
export async function handleImageUpload(file: Express.Multer.File): Promise<string> {
  // Verify actual file type (not just extension)
  const isValidType = await validateFileType(
    file.buffer,
    ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  );
  
  if (!isValidType) {
    throw new Error('Invalid file type');
  }
  
  // Scan file size
  if (file.size > env.MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error('File too large');
  }
  
  // Strip EXIF data (privacy)
  const cleanedBuffer = await stripExifData(file.buffer);
  
  // Upload to Cloudinary
  // ...
}
```

---

### 8. **Database Security** ⚠️ LOW PRIORITY

**Issue:** Database user has full privileges

**Recommendation:**

1. Create separate database users:
   - **Read-only user** for analytics/reporting
   - **App user** with INSERT, UPDATE, SELECT, DELETE only
   - **Migration user** with DDL permissions

2. Enable connection pooling limits:

```typescript
// packages/db/src/index.ts
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

---

### 9. **Add API Versioning Lock** ⚠️ LOW PRIORITY

**Issue:** No protection against breaking API changes

**File:** `apps/api/src/middlewares/apiVersion.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export function requireApiVersion(minVersion: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientVersion = req.headers['x-api-version'] as string;
    
    if (!clientVersion) {
      return res.status(400).json({
        error: 'Missing API version header',
        requiredVersion: minVersion,
      });
    }
    
    // Simple version comparison
    if (clientVersion < minVersion) {
      return res.status(426).json({
        error: 'API version too old. Please update your app.',
        currentVersion: clientVersion,
        requiredVersion: minVersion,
      });
    }
    
    next();
  };
}
```

---

### 10. **Environment Variable Security** ⚠️ HIGH PRIORITY

**Issue:** Secrets might be logged or exposed

**Add:** `apps/api/src/lib/secrets.ts`

```typescript
const SENSITIVE_KEYS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL',
  'REDIS_URL',
  'PAYSTACK_SECRET_KEY',
  'CLOUDINARY_API_SECRET',
  'RESEND_API_KEY',
  'GOOGLE_CLIENT_SECRET',
  'VAPID_PRIVATE_KEY',
  'SESSION_SECRET',
  'CRON_SECRET',
];

export function maskSensitiveData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const masked = { ...obj };
  
  for (const key in masked) {
    if (SENSITIVE_KEYS.some(k => key.includes(k))) {
      masked[key] = '***REDACTED***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  
  return masked;
}
```

Use in error handler:

```typescript
// apps/api/src/middlewares/errorHandler.ts
import { maskSensitiveData } from '../lib/secrets.js';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error({
    error: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    request: maskSensitiveData({
      method: req.method,
      url: req.url,
      body: req.body,
      query: req.query,
    }),
  });
  // ...
}
```

---

## 🛡️ Additional Security Best Practices

### 11. **Enable 2FA (Already in Codebase)**

2FA is already built but needs to be enabled in production:

```env
ENABLE_2FA=true
```

### 12. **Add Security Headers to Frontend**

**File:** `apps/web/vite.config.ts`

```typescript
export default defineConfig({
  // ...
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
});
```

### 13. **Implement API Key Rotation**

Create a schedule to rotate:
- JWT secrets (every 90 days)
- Paystack keys (annually)
- Database passwords (every 90 days)

### 14. **Add Dependency Scanning**

```bash
# Install
pnpm add -D npm-audit-resolver

# Add to package.json scripts:
"security:audit": "pnpm audit --audit-level=high",
"security:fix": "pnpm audit fix"
```

Run monthly to check for vulnerable dependencies.

### 15. **Set Up Security Monitoring**

Consider adding:
- **Sentry** (already in env) for error tracking
- **Cloudflare** for DDoS protection
- **LogRocket** for session replay (privacy-safe)

---

## 📋 Implementation Priority

### Immediate (This Week)
1. ✅ Secure cookies with httpOnly, secure, sameSite
2. ✅ Add CSRF protection
3. ✅ Improve Helmet configuration
4. ✅ Add password strength requirements
5. ✅ Secure file upload validation

### Short-term (This Month)
6. ✅ Add security event monitoring
7. ✅ Implement request size limits
8. ✅ Add environment variable masking
9. ✅ Enable 2FA in production
10. ✅ Set up dependency scanning

### Long-term (Next Quarter)
11. ✅ Database user privilege separation
12. ✅ API versioning enforcement
13. ✅ Security audit logging dashboard
14. ✅ Penetration testing
15. ✅ Bug bounty program

---

## 🔍 Testing Security

### Run These Tests:

1. **SQL Injection:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"' OR '1'='1"}'
   ```
   Expected: Validation error (Zod blocks it)

2. **XSS:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/vendors/:id/update \
     -H "Authorization: Bearer TOKEN" \
     -d '{"businessName":"<script>alert(1)</script>"}'
   ```
   Expected: Sanitized on output

3. **Rate Limiting:**
   ```bash
   for i in {1..15}; do
     curl -X POST http://localhost:5000/api/v1/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@test.com","password":"wrong"}'
   done
   ```
   Expected: 429 after 10 attempts

4. **CSRF:**
   Try making POST request without CSRF token
   Expected: 403 Forbidden

---

## 📞 Security Incident Response Plan

### If You Detect a Breach:

1. **Immediate:**
   - Enable maintenance mode
   - Rotate all secrets
   - Lock affected accounts

2. **Within 1 Hour:**
   - Identify breach scope
   - Notify affected users
   - Document timeline

3. **Within 24 Hours:**
   - Deploy fixes
   - Conduct forensic analysis
   - Report to authorities (if required by law)

4. **Post-Incident:**
   - Update security policies
   - Conduct team training
   - Publish transparency report

---

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)

---

## ✅ Security Checklist

Use this for regular security reviews:

- [ ] All secrets in environment variables (not hardcoded)
- [ ] HTTPS enabled in production
- [ ] Secure cookie settings active
- [ ] CSRF protection enabled
- [ ] Rate limiting on all endpoints
- [ ] Input validation with Zod
- [ ] SQL injection protection (Drizzle ORM)
- [ ] XSS protection (DOMPurify)
- [ ] File upload validation (magic numbers)
- [ ] Strong password requirements
- [ ] Account lockout after failed logins
- [ ] 2FA available
- [ ] Security headers configured (Helmet)
- [ ] Error messages don't leak sensitive info
- [ ] Logging excludes sensitive data
- [ ] Dependencies up to date
- [ ] Regular security audits
- [ ] Incident response plan documented
- [ ] Team security training completed

---

**Last Updated:** 2026-07-14  
**Next Review:** 2026-08-14
