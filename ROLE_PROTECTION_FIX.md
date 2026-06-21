# Role-Based Route Protection Fix

## Issue
Super admins and other users could access any dashboard regardless of their role. There was no route protection or automatic redirection based on user roles.

## Root Cause
The three layout components (`AdminLayout`, `VendorLayout`, `CustomerLayout`) had no role verification logic. Any logged-in user could manually navigate to any URL and see the corresponding dashboard.

## Fix Applied

### Files Modified
1. `apps/web/src/components/layout/AdminLayout.tsx`
2. `apps/web/src/components/layout/VendorLayout.tsx`
3. `apps/web/src/components/layout/CustomerLayout.tsx`

### Changes Made

#### 1. AdminLayout.tsx
**Added role protection logic:**
- Redirects to `/login` if user is not authenticated
- Redirects to `/vendor/dashboard` if user is a vendor
- Redirects to `/account` if user is a customer
- Only allows `admin`, `super_admin`, and `moderator` roles

```typescript
useEffect(() => {
  if (loading) return;
  
  if (!user) {
    setLocation("/login");
    return;
  }

  if (user.role !== "admin" && user.role !== "super_admin" && user.role !== "moderator") {
    if (user.role === "vendor") {
      setLocation("/vendor/dashboard");
    } else {
      setLocation("/account");
    }
  }
}, [user, loading, setLocation]);
```

#### 2. VendorLayout.tsx
**Added role protection logic:**
- Redirects to `/login` if user is not authenticated
- Redirects to `/admin` if user is an admin/super_admin/moderator
- Redirects to `/account` if user is a customer
- Only allows `vendor` role

```typescript
useEffect(() => {
  if (loading) return;
  
  if (!user) {
    setLocation("/login");
    return;
  }

  if (user.role !== "vendor") {
    if (user.role === "admin" || user.role === "super_admin" || user.role === "moderator") {
      setLocation("/admin");
    } else {
      setLocation("/account");
    }
  }
}, [user, loading, setLocation]);
```

#### 3. CustomerLayout.tsx
**Added role protection logic:**
- Redirects to `/login` if user is not authenticated
- Redirects to `/admin` if user is an admin/super_admin/moderator
- Redirects to `/vendor/dashboard` if user is a vendor
- Only allows `customer` role

```typescript
useEffect(() => {
  if (loading) return;
  
  if (!user) {
    setLocation("/login");
    return;
  }

  if (user.role !== "customer") {
    if (user.role === "admin" || user.role === "super_admin" || user.role === "moderator") {
      setLocation("/admin");
    } else if (user.role === "vendor") {
      setLocation("/vendor/dashboard");
    }
  }
}, [user, loading, setLocation]);
```

## Role Mapping

Based on database schema (`packages/db/src/schema/users.ts`):

| Role | Dashboard Route | Access Level |
|------|----------------|--------------|
| `super_admin` | `/admin` | Full admin panel access |
| `admin` | `/admin` | Admin panel access |
| `moderator` | `/admin` | Admin panel access |
| `vendor` | `/vendor/dashboard` | Vendor dashboard only |
| `customer` | `/account` | Customer dashboard only |

## Behavior

### Before Fix
- Any logged-in user could visit any URL
- Super admins could see customer pages
- Customers could see admin pages
- No automatic redirection
- Security risk

### After Fix
- Users are automatically redirected to their correct dashboard
- Attempting to access wrong dashboard triggers instant redirect
- Loading state prevents flash of unauthorized content
- Protection applies on every render (handles page refresh, direct URL access)

## Testing

To verify the fix works:

1. **As Super Admin:**
   - Navigate to `/account` → should redirect to `/admin`
   - Navigate to `/vendor/dashboard` → should redirect to `/admin`
   - Navigate to `/admin` → should stay on admin dashboard

2. **As Vendor:**
   - Navigate to `/account` → should redirect to `/vendor/dashboard`
   - Navigate to `/admin` → should redirect to `/vendor/dashboard`
   - Navigate to `/vendor/dashboard` → should stay on vendor dashboard

3. **As Customer:**
   - Navigate to `/admin` → should redirect to `/account`
   - Navigate to `/vendor/dashboard` → should redirect to `/account`
   - Navigate to `/account` → should stay on customer dashboard

4. **When Not Logged In:**
   - Navigate to any protected route → should redirect to `/login`

## Security Notes

- This is **frontend protection only** for UX purposes
- Backend API endpoints must also have role verification (already implemented via `requireRole` middleware)
- The `loading` check prevents redirect flicker during auth state hydration
- Direct URL manipulation is now protected
- Browser back/forward navigation is protected

## Dependencies

- Requires `loading` state from `AuthContext` (already exists)
- Uses `useLocation` from `wouter` for navigation
- Relies on `user.role` from backend API

## Deployment

No database changes required. Changes are frontend-only. Deploy frontend and changes take effect immediately.

---

**Fix Date:** 2026-06-21  
**Priority:** Critical  
**Status:** ✅ Complete
