# Critical Issues Identified

## 🔴 CRITICAL (Breaking Functionality)

### 1. Featured Listing Payment Fails with 500 Error
**Error**: `null value in column "user_id" of relation "payments" violates not-null constraint`
**Location**: `apps/api/src/modules/payments/payments.routes.ts` line 144
**Cause**: Missing `userId` when inserting payment record for featured listings
**Impact**: Featured listing payments completely broken

### 2. Featured Listing Price Wrong
**Error**: Showing ₦2,500,000 instead of ₦25,000
**Location**: `apps/api/src/modules/payments/payments.routes.ts` line 63
**Cause**: `amount = 2500000` is in kobo but then multiplied by 100 again
**Fix**: Should be `amount = 2500000` (already in kobo, don't multiply)

### 3. Image Upload Not Persisting
**Issue**: Uploads work but disappear after page refresh
**Likely Cause**: Field name mismatch - using `coverImageUrl` vs `coverUrl`
**Impact**: Vendors can't set profile images

## 🟡 HIGH PRIORITY (Missing Features)

### 4. Admin Analytics Not Updating
- Subscriptions this month: not counting
- Commission tracking: not calculating
- Booking revenue: not tracking

### 5. Admin Settings Not Displaying DB Values
- Current fees don't match database
- Featured listing config missing
- Auto-feature on payment toggle missing

### 6. Booking Commission Tracking Missing
- No commission calculation on bookings
- No UI for vendors to see/pay commission
- No monthly commission payment flow

### 7. Legal Pages Incomplete
- Privacy Policy missing platform details
- Terms of Service incomplete
- Commission policy not documented

## 🟢 MEDIUM PRIORITY (UX/Polish)

### 8. Announcements/Tips Email Broadcast
- Need to send to "Stay in Loop" email subscribers
- Need email notification option

### 9. Footer Location
- Change to "Port Harcourt"
- Update SVG logo

### 10. Vendor Card Display
- What image shows on vendor cards in browse view?
- Logo vs cover image clarification needed

## 📋 Order of Fixes

1. Fix featured listing payment (CRITICAL - breaks payments)
2. Fix image upload persistence
3. Fix admin analytics calculations
4. Add commission tracking system
5. Update admin settings UI
6. Update legal pages
7. Add announcement broadcast
8. Fix footer location
9. Clarify vendor card images
