# Casa Corona - Comprehensive Issues Analysis Report

**Date:** 2026-06-21  
**Status:** No Edits - Analysis Only

---

## 🔴 CRITICAL ISSUES

### 1. AdminAuditLog - Missing Button Import (PAGE CRASH)
**Error:** `Uncaught ReferenceError: Button is not defined at AdminAuditLog (AdminAuditLog.tsx:164:20)`

**Location:** `apps/web/src/pages/admin/AdminAuditLog.tsx`

**Root Cause:**
- Line 164 uses `<Button>` component for pagination
- Lines 164 and 167 have Button components
- **NO import statement** for Button at top of file
- Import statement missing: `import { Button } from "@/components/ui/button";`

**Impact:** Admin audit log page is completely blank/broken

**Fix Required:** Add Button import to line ~7

---

### 2. Admin Refunds 403 Forbidden (PERMISSION DENIED)
**Error:** `Failed to load resource: the server responded with a status of 403 (Forbidden): /api/v1/payments/payments`

**Location:** Backend endpoint `/api/v1/payments/payments` in `apps/api/src/modules/payments/payments.routes.ts`

**Root Cause:**
- Line 297: `router.get("/payments", requireAuth, requireRole("admin"), ...)`
- Requires role **exactly** `"admin"`
- Your user role is `"super_admin"` (database enum includes this role)
- `requireRole("admin")` middleware **does NOT accept** `super_admin` or `moderator`

**Impact:** Super admins cannot view refunds page

**Backend Role Check Logic:**
```typescript
// Line 297 only allows "admin", not "super_admin"
router.get("/payments", requireAuth, requireRole("admin"), ...)
```

**Database Roles Available:**
- `customer`, `vendor`, `moderator`, `admin`, `super_admin`

**Fix Required:** 
- Change `requireRole("admin")` to accept super_admin
- OR use `requireRole(["admin", "super_admin", "moderator"])`

---

### 3. Backend Crash - Socket.io Chat Gateway Error
**Error:** 
```
ForbiddenError: Not a party to this conversation
at Module.markRead (conversation.service.ts:207:23)
at Socket.<anonymous> (chat.gateway.ts:31:5)
```

**Location:** `apps/api/src/realtime/chat.gateway.ts` line 31

**Root Cause:**
- Admin user trying to read conversation they're not part of
- Chat gateway doesn't handle admin role exception
- `markRead` service throws 403 for non-participants
- Socket.io handler doesn't catch this error properly
- **Causes backend to crash/restart**

**Impact:** 
- Backend crashes when admin views conversations
- WebSocket connections fail: `ERR_CONNECTION_RESET`, `ERR_CONNECTION_REFUSED`
- Chat feature broken for all users when crash occurs

**WebSocket Errors Seen:**
```
Failed to load resource: net::ERR_CONNECTION_RESET: /api/v1/conversations/c2345d62-8890-4fd9-aae0-00915d13a73f/read
WebSocket connection to 'ws://localhost:5000/socket.io/?EIO=4&transport=websocket' failed
```

**Fix Required:**
- Add try-catch in chat gateway socket handler
- Allow admins to view all conversations (bypass party check)
- Or prevent admins from accessing customer/vendor chat interface

---

## 🟠 HIGH PRIORITY ISSUES

### 4. AdminAnalytics Modal - [object Object] Display
**Error:** "Total Users[object Object]Total Vendors[object Object]"

**Location:** `apps/web/src/pages/admin/AdminAnalytics.tsx` lines 35-38

**Root Cause:**
- Lines 35-38 use `String(stats?.users)` and `String(stats?.vendors)`
- These are objects `{total: number, byRole: {...}}` not numbers
- `String()` of object returns `[object Object]`

**Current Code:**
```typescript
{ label: "Total Users",   value: String((stats as any)?.users ?? 0),   icon: Users },
{ label: "Total Vendors", value: String((stats as any)?.vendors ?? 0), icon: Store },
```

**Should Be:**
```typescript
{ label: "Total Users",   value: String((stats as any)?.users?.total ?? 0),   icon: Users },
{ label: "Total Vendors", value: String((stats as any)?.vendors?.total ?? 0), icon: Store },
```

**Impact:** Admin analytics shows garbage text instead of numbers

**Fix Required:** Access `.total` property of users and vendors objects

---

### 5. Vendor Profile - Business Details Not Displaying
**Location:** `apps/web/src/pages/vendor/VendorProfile.tsx`

**Root Cause (Probable):**
- Line 30: `const { data: vendor, loading } = useApi(() => myVendorApi.get());`
- API endpoint: `/api/v1/vendors/me`
- Either:
  - A. Vendor profile doesn't exist in DB (user has vendor role but no vendor record)
  - B. API returns null/undefined
  - C. Form fields not rendering when vendor is undefined

**Form Seeding:**
- Lines 38-55: `useEffect` sets form only when vendor exists
- Dependency: `[vendor?.id]` - only runs when vendor.id changes
- If vendor is null, form never populates

**Impact:** Vendor profile page shows empty form fields

**Diagnosis Needed:**
- Check if vendor record exists: `SELECT * FROM vendors WHERE userId = ?`
- Check API response for `/vendors/me`

---

### 6. Vendor Subscription Page 404 (Route Doesn't Exist)
**Error:** `Failed to load resource: the server responded with a status of 404 (Not Found)`

**Location:** 
- `apps/web/src/pages/vendor/VendorDashboard.tsx` line 73 and 147
- Links to `/vendor/subscription` route

**Root Cause:**
- **VendorSubscription.tsx was deleted** (Fix #3 from Hermes)
- Functionality was supposed to be moved to VendorPayments.tsx
- But dashboard links still point to old `/vendor/subscription` route
- Route **NOT defined** in App.tsx

**Current Bad Links:**
```typescript
// Line 73
<Link href="/vendor/subscription" className="underline font-semibold">Renew now</Link>

// Line 147
<Link href="/vendor/subscription">Manage Subscription</Link>
```

**Impact:** Clicking "Manage Subscription" or "Renew now" goes to 404 page

**Fix Required:** Change links to `/vendor/payments`

---

### 7. Vendor Profile/Cover Image Upload Not Working
**Location:** `apps/web/src/pages/vendor/VendorProfile.tsx` lines 70-96

**Root Cause:**
- Line 74: `const { urls } = await uploadApi.images([file]);`
- **Wrong parameter format** - `uploadApi.images()` expects `FormData`, not array
- Should create FormData and append file

**Current Wrong Code:**
```typescript
const { urls } = await uploadApi.images([file]);  // WRONG
```

**api-client.ts Upload Implementation:**
```typescript
// Line in api-client.ts
images: async (files: FormData) => {
  const res = await fetch(`${API_BASE_URL}/uploads/images`, {
    method: "POST",
    body: files,  // Expects FormData, not array
```

**Impact:** 
- Image upload appears to succeed (no error)
- But images never display
- Upload never actually happens or fails silently

**Fix Required:**
```typescript
const fd = new FormData();
fd.append('images', file);
const { urls } = await uploadApi.images(fd);
```

**Same issue in:**
- `handleLogoUpload()` line 74
- `handleCoverUpload()` line 86

---

### 8. Vendor Subscribe Error - "Vendor profile not found"
**Error:** `Failed to load resource: the server responded with a status of 404 (Not Found)`

**Location:** Backend `apps/api/src/modules/payments/payments.routes.ts` line 51

**Root Cause:**
```typescript
// Line 51-52
const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.userId, userId));
if (!vendor) return notFound(res, "Vendor profile not found");
```

**Why This Happens:**
- User has role `"vendor"` in users table
- But **NO corresponding record** in vendors table
- Vendor profile must be created after vendor signup
- Possibly missing vendor onboarding flow

**Impact:** Vendors cannot subscribe to plans - critical payment blocker

**Fix Required:**
- Ensure vendor record is created when user role is set to vendor
- Add vendor creation step to vendor signup flow
- Or add "Complete Profile" step before allowing subscription

---

### 9. Set Password Banner Showing for Regular Users
**Location:** `apps/web/src/pages/customer/Account.tsx` line 284

**Current Logic:**
```typescript
{user && !user.hasPassword && (
  <div className="bg-amber-50...">Set a password for direct login</div>
)}
```

**Backend Returns:**
- `hasPassword: !!passwordHash` (line 13 in user.service.ts)

**Issue:**
- `hasPassword` is a **derived field** from backend
- BUT: Frontend might be showing cached/stale user object
- OR: `hasPassword` is undefined initially, treated as falsy

**Why It Shows for Regular Users:**
- If user object doesn't have `hasPassword` field → `!user.hasPassword` is true
- Missing field is treated as falsy → banner shows

**Impact:** Confusing UX - users with passwords see "set password" banner

**Fix Required:**
- Check explicitly: `user.hasPassword === false` (not just falsy check)
- Or: `!user.hasPassword && user.googleId` (only show for OAuth users)

---

## 🟡 MEDIUM PRIORITY ISSUES

### 10. Rate Limiting Still Too Aggressive
**Current Setting:** 1000 requests / 15 minutes

**User Complaint:** "turn off the rate limiting as well or do something about it so it will stop being so annoying"

**Issue:**
- While increased from 100 to 1000, still causes friction in development
- Every hot reload, page refresh, API call counts toward limit
- Development workflow involves lots of refreshes

**Fix Options:**
1. Disable entirely for development: `if (env.NODE_ENV === "development") { /* skip */ }`
2. Increase to 10,000 requests for development
3. Whitelist localhost IPs

---

### 11. No Vendor Notification UI
**Location:** `apps/web/src/components/layout/VendorLayout.tsx`

**Current State:**
- Line 68: Socket handler for `notification:new` exists (shows toast)
- **NO notification bell icon** in vendor layout sidebar
- **NO `/vendor/notifications` route** in App.tsx
- **NO VendorNotifications.tsx page**

**Customer Has:**
- Bell icon in CustomerLayout
- `/notifications` route
- Notifications page

**Vendor Has:**
- Socket listener (receives notifications)
- Toast popups
- **NO UI to view notification history**
- **NO notification bell badge**

**Impact:** Vendors receive notifications but can't review them later

**Fix Required:**
- Add Bell icon with badge to VendorLayout sidebar
- Create VendorNotifications.tsx page
- Add `/vendor/notifications` route
- Copy customer notifications UI pattern

---

### 12. Vendor Can't See Announcements In-App
**Related to:** Issue #11

**Backend:**
- Admins can broadcast announcements to "vendors" role
- Announcements sent as notifications

**Frontend:**
- No notification panel for vendors → can't see announcements
- Announcements sent but invisible to recipients

**Impact:** Admin broadcasts don't reach vendors effectively

---

## 🔵 LOW PRIORITY / ENHANCEMENT ISSUES

### 13. No Featured Listing Payment UI
**Current State:**
- Backend supports featured subscriptions (separate from regular subscription)
- No UI to purchase featured listing
- No toggle in VendorPayments.tsx

**Missing:**
- Featured plan card in VendorPayments
- "Upgrade to Featured" button
- Featured status display in vendor dashboard

---

### 14. No Auto-Feature on Payment Toggle
**Current State:**
- Backend has `auto_verify_on_payment` setting
- No equivalent `auto_feature_on_payment`

**Missing:**
- Admin toggle in AdminSettings for auto-featuring vendors on payment
- Backend logic to set `featured: true` on payment webhook

---

### 15. No Subscription Expiry Tracking UI
**Missing Features:**
- Days remaining display in vendor dashboard
- "Expires in X days" warning
- Visual countdown/progress bar
- Color-coded warning (green > 30d, yellow < 30d, red < 7d)

**Backend Has:**
- `subscriptionExpiresAt` field in vendors table
- Cron job warns at 5d, 2d, 1d

**Frontend Missing:**
- Real-time countdown calculation
- Visual expiry indicator

---

### 16. No "Pay Early" Logic for Subscriptions
**Current State:**
- Vendors must wait for expiry to renew
- No option to extend subscription before expiry

**Missing:**
- "Extend subscription" button when subscription is active
- Logic to add months to existing `expiresAt` date (not replace it)
- Backend route to handle early renewal

---

### 17. No Featured Listing Expiry Tracking
**Current State:**
- Backend has `featuredUntil` field
- No UI showing featured status expiry
- No countdown for featured listing

**Missing:**
- Featured badge with expiry date in vendor dashboard
- "Featured until DATE" display
- Option to renew featured status

---

## 📊 ERROR SUMMARY

| Issue | Severity | Type | Status |
|-------|----------|------|--------|
| AdminAuditLog missing Button import | Critical | Frontend Crash | Not Fixed |
| Admin Refunds 403 permission | Critical | Backend Auth | Not Fixed |
| Socket.io chat crash | Critical | Backend Crash | Not Fixed |
| AdminAnalytics [object Object] | High | Frontend Display | Not Fixed |
| Vendor profile empty | High | Data/Display | Investigation Needed |
| /vendor/subscription 404 | High | Routing | Not Fixed |
| Image upload broken | High | Upload Logic | Not Fixed |
| Vendor subscribe 404 | High | Missing Data | Not Fixed |
| Set password banner wrong | High | Logic Bug | Not Fixed |
| Rate limiting annoying | Medium | Dev Experience | Partially Fixed |
| No vendor notifications UI | Medium | Missing Feature | Not Fixed |
| No vendor announcements | Medium | Missing Feature | Not Fixed |
| No featured payment UI | Low | Enhancement | Not Implemented |
| No auto-feature toggle | Low | Enhancement | Not Implemented |
| No subscription expiry UI | Low | Enhancement | Not Implemented |
| No pay-early logic | Low | Enhancement | Not Implemented |
| No featured expiry tracking | Low | Enhancement | Not Implemented |

---

## 🔧 FIXES PRIORITIZATION

### MUST FIX IMMEDIATELY (Blocking Core Functions):
1. Socket.io chat crash → Backend crash affecting all users
2. AdminAuditLog Button import → Admin feature broken
3. Admin Refunds 403 → Super admin access denied
4. Image upload broken → Vendors can't complete profiles
5. Vendor subscribe 404 → Payment system blocked

### SHOULD FIX SOON (Poor UX):
6. /vendor/subscription 404 → Broken navigation
7. AdminAnalytics [object Object] → Confusing display
8. Vendor profile empty → Investigation + fix
9. Set password banner wrong → Annoying users

### CAN FIX LATER (Enhancements):
10. Rate limiting → Adjust for better dev experience
11. Vendor notifications UI → Missing but non-blocking
12. Featured listing features → Enhancement features
13. Expiry tracking → Nice-to-have improvements

---

**End of Report**
