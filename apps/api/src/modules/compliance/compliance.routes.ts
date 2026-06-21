
import { Router, Response, NextFunction } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { db, usersTable, auditLogsTable } from "@casa-corona/db";
import { eq } from "drizzle-orm";
import { AuthRequest } from "../../middlewares/requireAuth";
import { ok } from "../../lib/response";

const router = Router();

const PRIVACY_POLICY = `
# Privacy Policy

Last updated: June 21, 2026

## Introduction

Welcome to Casa Corona. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our platform.

## Information We Collect

### Personal Information
- **Account Information**: Name, email address, phone number, and password
- **Vendor Information**: Business name, address, contact details, social media handles, business hours, portfolio images, services, and products
- **Customer Information**: Booking details, preferences, saved vendors, and reviews
- **Payment Information**: Transaction data processed securely through Paystack (we do not store full card details)

### Automatically Collected Information
- **Usage Data**: Pages visited, time spent, clicks, and navigation patterns
- **Device Information**: IP address, browser type, operating system, and device identifiers
- **Location Data**: City, state, and approximate location (with your permission)

## How We Use Your Information

We use your information to:
- **Provide Services**: Facilitate bookings, payments, subscriptions, and vendor-customer communications
- **Improve Platform**: Analyze usage patterns, optimize features, and enhance user experience
- **Communication**: Send booking confirmations, subscription reminders, promotional offers, and announcements
- **Security**: Detect fraud, prevent abuse, and maintain platform integrity
- **Compliance**: Meet legal obligations and enforce our terms of service
- **Analytics**: Generate insights for vendors (profile views, booking statistics) and admins (platform performance, commission tracking)

## Commission and Payment Tracking

- Vendors agree that Casa Corona earns a commission on completed bookings (default 10%, configurable by admin)
- All bookings are tracked with commission amounts calculated automatically
- Monthly commission invoices are generated on the 1st of each month for the previous month's completed bookings
- Vendors receive email and in-app notifications about pending commissions
- Payment records are maintained for accounting, tax compliance, and dispute resolution

## Featured Listings

- Vendors can pay for featured placement (default ₦25,000/month, configurable by admin)
- Featured listings appear at the top of search results and browse pages
- Featured status activates immediately upon successful payment verification
- Featured duration is 30 days from activation date
- Auto-renewal is not enabled by default; vendors must manually renew

## Subscription Management

- Vendor subscriptions activate upon successful payment
- Subscription fees cover monthly platform access and listing visibility
- Grace periods and warning notifications are configured in platform settings
- Auto-verification may be enabled upon payment completion (admin configurable)
- Subscription status affects listing visibility and booking capabilities

## Information Sharing

We do not sell your personal information. We share data only in these circumstances:
- **Vendors & Customers**: Contact details shared when bookings are confirmed
- **Payment Processors**: Paystack processes payments securely on our behalf
- **Service Providers**: Cloudinary (image hosting), email services, and push notification providers
- **Legal Requirements**: When required by law, court order, or government regulation
- **Business Transfers**: In case of merger, acquisition, or sale of assets

## Data Security

We implement industry-standard security measures:
- Encrypted data transmission (HTTPS/TLS)
- Secure password hashing (bcrypt)
- Regular security audits and monitoring
- Access controls and authentication
- Secure cloud infrastructure

## Your Rights

You have the right to:
- **Access**: Request a copy of your personal data
- **Correction**: Update or correct inaccurate information
- **Deletion**: Request deletion of your account and data
- **Objection**: Opt out of marketing communications
- **Portability**: Export your data in a portable format
- **Restriction**: Limit how we process your data

To exercise these rights, contact us at support@casacorona.org.

## Cookies and Tracking

We use cookies and similar technologies to:
- Maintain your login session
- Remember your preferences
- Analyze site usage and performance
- Provide personalized recommendations

You can control cookies through your browser settings.

## Third-Party Services

Our platform integrates with:
- **Paystack**: Payment processing (see Paystack Privacy Policy)
- **Cloudinary**: Image hosting and optimization
- **Pusher**: Real-time messaging and notifications
- **Email Services**: Transactional and promotional emails

These services have their own privacy policies.

## Children's Privacy

Casa Corona is not intended for users under 18. We do not knowingly collect data from children.

## International Users

Your data may be processed in Nigeria or other countries where our service providers operate. By using Casa Corona, you consent to international data transfers.

## Changes to This Policy

We may update this privacy policy periodically. Changes are effective when posted. We will notify you of significant changes via email or platform announcement.

## Contact Us

For privacy concerns or questions:
- Email: support@casacorona.org
- Phone: +234 800 CASA
- Address: Port Harcourt, Nigeria

---

By using Casa Corona, you acknowledge that you have read and understood this Privacy Policy.
`;

const TERMS_OF_SERVICE = `
# Terms of Service

Last updated: June 21, 2026

## 1. Acceptance of Terms

By accessing or using Casa Corona ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform.

## 2. Definitions

- **"Platform"**: The Casa Corona website, mobile applications, and all related services
- **"Vendor"**: A business or individual offering self-care services or products
- **"Customer"**: A user booking services or purchasing products
- **"Admin"**: Casa Corona platform administrators
- **"Content"**: Text, images, videos, reviews, and other materials posted on the Platform

## 3. User Accounts

### Registration
- You must provide accurate, complete, and current information
- You are responsible for maintaining the confidentiality of your account credentials
- You must notify us immediately of any unauthorized access
- One person or business may maintain only one active vendor account

### Account Types
- **Customer Account**: Free to create, browse vendors, book services, and leave reviews
- **Vendor Account**: Requires registration fee (₦45,000, admin configurable) and monthly subscription (₦7,000, admin configurable)
- **Admin Account**: Platform management access (by invitation only)

## 4. Vendor Obligations

### Subscription Requirements
- Vendors must maintain an active subscription to receive bookings
- Registration fee is one-time and non-refundable
- Monthly subscription fees are due in advance
- Inactive subscriptions result in reduced listing visibility
- Grace periods and warning notifications are provided (configurable by admin)

### Commission Structure
- Casa Corona earns a commission on all completed bookings (default 10%, admin configurable)
- Commission is calculated automatically when bookings are marked "completed"
- Monthly commission invoices are generated on the 1st of each month
- Invoices cover the previous month's completed bookings
- Vendors receive email and in-app notifications for pending commissions
- Payment is due within 30 days of invoice generation
- Failure to pay commissions may result in account suspension

### Featured Listings
- Vendors can purchase featured placement (default ₦25,000/month, admin configurable)
- Featured status activates immediately upon payment verification
- Featured listings appear at the top of search results for 30 days
- No auto-renewal; vendors must manually purchase featured status each period
- Featured status does not guarantee bookings or specific results

### Content Standards
- All business information must be accurate and current
- Profile images and portfolio shots must be owned by you or properly licensed
- Descriptions must not contain false, misleading, or deceptive claims
- Prohibited content includes: illegal services, adult content, hate speech, spam, or malware
- Casa Corona reserves the right to remove non-compliant content without notice

### Service Delivery
- Vendors must honor all confirmed bookings at agreed prices
- Vendors must respond to customer inquiries within 24 hours
- Cancellations must follow the platform's cancellation policy
- Vendors are responsible for service quality, safety, and professionalism

## 5. Customer Obligations

### Bookings
- Provide accurate contact information for all bookings
- Arrive on time for appointments
- Follow vendor-specific policies (cancellation, deposits, etc.)
- Pay agreed amounts for services or products

### Reviews
- Reviews must be honest, accurate, and based on personal experience
- Prohibited: fake reviews, threats, harassment, or defamatory statements
- Casa Corona may remove reviews that violate these terms

### Communication
- Use chat and messaging features respectfully and professionally
- Harassment, spam, or abusive behavior may result in account suspension

## 6. Payment and Refunds

### Payment Processing
- All payments are processed securely through Paystack
- You agree to Paystack's terms of service and privacy policy
- Casa Corona does not store full credit card information
- All prices are in Nigerian Naira (NGN)

### Refund Policy
- Subscription fees: Non-refundable after subscription activation
- Registration fees: Non-refundable
- Featured listing fees: Non-refundable after activation
- Booking payments: Refunds subject to vendor-specific policies
- Admin-initiated refunds: Available at Casa Corona's discretion for verified issues

### Failed Payments
- Failed subscription payments result in grace period notification (configurable by admin)
- Repeated payment failures may result in subscription cancellation
- Outstanding commission invoices may result in account suspension

## 7. Intellectual Property

### Platform Content
- Casa Corona owns all platform design, code, logos, and branding
- You may not copy, reproduce, or create derivative works without permission

### User Content
- You retain ownership of content you post
- By posting, you grant Casa Corona a worldwide, royalty-free license to use, display, and distribute your content
- You represent that you have all necessary rights to posted content

## 8. Announcements and Communications

### Platform Announcements
- Admins may send announcements to all users or targeted segments (customers, vendors, specific cities)
- Announcements are delivered via in-app notifications and email
- Broadcast announcements may be sent to newsletter subscribers in the footer "Stay in the loop" field
- Maintenance mode announcements may temporarily restrict platform access for non-admins

### Promotional Communications
- You may receive promotional emails, tips, and offers
- You can opt out via unsubscribe links or account settings
- Transactional emails (booking confirmations, invoices) cannot be disabled

## 9. Privacy and Data Protection

- Your use of the Platform is governed by our Privacy Policy
- We collect, use, and protect your data as described in the Privacy Policy
- You consent to data processing necessary to provide services

## 10. Prohibited Conduct

You may not:
- Violate any laws or regulations
- Impersonate another person or entity
- Harass, threaten, or abuse other users
- Post false, misleading, or fraudulent content
- Scrape, crawl, or automate access to the Platform
- Reverse engineer or attempt to breach security
- Use the Platform for money laundering or illegal transactions

## 11. Account Suspension and Termination

Casa Corona reserves the right to suspend or terminate accounts for:
- Violation of these Terms of Service
- Non-payment of fees or commissions
- Fraudulent or abusive behavior
- Illegal activity
- Repeated customer complaints

You may delete your account at any time via account settings. Deletion is permanent and irreversible.

## 12. Disclaimers

### Platform Availability
- The Platform is provided "as is" and "as available"
- We do not guarantee uninterrupted or error-free service
- We may modify, suspend, or discontinue features at any time

### Vendor Services
- Casa Corona is a marketplace platform, not a service provider
- We do not endorse or guarantee vendor services
- We are not responsible for vendor conduct, service quality, or disputes
- Customers book vendors at their own risk

### Reviews and Ratings
- Reviews reflect individual opinions and are not verified by Casa Corona
- We do not guarantee accuracy or completeness of reviews

## 13. Limitation of Liability

To the fullest extent permitted by law:
- Casa Corona is not liable for indirect, incidental, or consequential damages
- Our total liability is limited to the amount you paid to us in the past 12 months
- We are not liable for losses resulting from vendor services, payment processing, or third-party actions

## 14. Indemnification

You agree to indemnify and hold Casa Corona harmless from claims, damages, or expenses arising from:
- Your use of the Platform
- Your violation of these Terms
- Your violation of any third-party rights
- Content you post

## 15. Dispute Resolution

### Governing Law
These Terms are governed by the laws of Nigeria.

### Disputes Between Users
Disputes between vendors and customers should be resolved directly. Casa Corona may assist but is not obligated to intervene.

### Disputes with Casa Corona
For disputes with Casa Corona, contact support@casacorona.org. We will attempt to resolve issues informally before pursuing legal action.

## 16. Changes to Terms

We may update these Terms at any time. Changes are effective when posted. Continued use constitutes acceptance. We will notify users of material changes via email or platform announcement.

## 17. Severability

If any provision of these Terms is found invalid or unenforceable, the remaining provisions remain in full effect.

## 18. Contact Information

For questions or concerns about these Terms:
- Email: support@casacorona.org
- Phone: +234 800 CASA
- Address: Port Harcourt, Nigeria

---

By using Casa Corona, you acknowledge that you have read, understood, and agree to these Terms of Service.
`;

router.get("/privacy-policy", (req: AuthRequest, res: Response) => {
  res.setHeader("Content-Type", "text/plain");
  res.send(PRIVACY_POLICY);
});

router.get("/terms", (req: AuthRequest, res: Response) => {
  res.setHeader("Content-Type", "text/plain");
  res.send(TERMS_OF_SERVICE);
});

router.post("/cookie-consent", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      await db.insert(auditLogsTable).values({
        actorId: req.user.userId,
        action: "cookie_consent",
        resourceType: "compliance",
        changes: req.body,
      });
    }
    ok(res);
  } catch (e) {
    next(e);
  }
});

router.post("/users/me/delete-account", requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await db
      .update(usersTable)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(usersTable.id, req.user!.userId));
    await db.insert(auditLogsTable).values({
      actorId: req.user!.userId,
      action: "delete_account",
      resourceType: "user",
      resourceId: req.user!.userId,
    });
    ok(res);
  } catch (e) {
    next(e);
  }
});

export default router;
