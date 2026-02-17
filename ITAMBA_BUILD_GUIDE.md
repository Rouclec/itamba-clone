# Itamba Legal Library - Build Guide

## Overview

This is a complete rebuild of the Itamba legal library platform with focus on **performance optimization**, **mobile-first responsiveness**, and **comprehensive performance monitoring**. The application implements both email and phone number signup flows with realistic mock API simulations.

## Architecture Highlights

### 1. **Rendering Strategy**
- **Server Components**: Layout, metadata, static pages for optimal SEO and performance
- **Client Components**: Interactive signup forms with state management
- **Code Splitting**: Each signup step is a separate route to minimize bundle size
- **Lazy Loading**: Background images and components load on-demand

### 2. **Performance Optimizations**

#### Initial Load Time
- Next.js Image component with automatic optimization (WebP, responsive sizing)
- Route-based code splitting reduces JavaScript per page
- CSS-in-JS with Tailwind for minimal CSS
- Geist fonts loaded via Google Fonts with `subsets`

#### Runtime Performance
- React Context for lightweight state management (no Redux overhead)
- Client-side form validation with Zod for instant feedback
- Debounced input handlers to prevent excessive re-renders
- LocalStorage for form persistence without database roundtrips

#### Network Performance
- Mock API delays (500-2000ms) simulate realistic API response times
- Structured to test behavior with slow networks
- Sonner for lightweight toast notifications
- Optimistic UI updates where applicable

### 3. **Responsive Design**
- **Mobile-First**: All components designed for mobile, enhanced for desktop
- **Layout**: 50/50 split on desktop (image + form), 100% stacked on mobile
- **Images**: Library background hidden on mobile to save bandwidth
- **Touch-Friendly**: Buttons 44px+ height on mobile, proper spacing for touch targets
- **Grid System**: Flexible Tailwind grid that adapts to screen size

## Project Structure

```
app/
├── layout.tsx                 # Root layout with analytics setup
├── page.tsx                   # Home page with CTA
├── auth/
│   ├── layout.tsx            # SignupProvider wrapper
│   └── signup/
│       ├── page.tsx          # Email vs Phone choice
│       ├── email/
│       │   ├── page.tsx      # Email entry form
│       │   └── verify/page.tsx # Email verification with loader
│       ├── phone/
│       │   ├── page.tsx      # Phone entry form
│       │   └── otp/page.tsx  # OTP verification (6-digit input)
│       ├── password/page.tsx # Password creation & confirmation
│       ├── career/page.tsx   # Role/career selection
│       └── success/page.tsx  # Success screen with profile CTA
├── analytics/page.tsx         # Performance dashboard
└── load-test/page.tsx         # Load testing simulator

components/
├── auth/
│   ├── signup-layout.tsx      # Shared layout component
│   ├── form-input.tsx         # Input with validation states
│   ├── otp-input.tsx          # 6-digit OTP input component
│   ├── role-selector.tsx      # Multi-select career buttons
│   ├── verification-loader.tsx # Email/OTP verification modal
│   └── signup-provider.tsx    # Context provider
├── analytics/
│   └── performance-dashboard.tsx # Web Vitals charts
├── error-boundary.tsx         # Error handling component
└── ui/                        # Shadcn components

lib/
├── signup-context.ts          # State management context
├── form-validators.ts         # Zod schemas for all forms
├── mock-api.ts               # Simulated API calls with delays
├── performance-monitor.ts     # Web Vitals collection
└── load-test.ts              # Load testing utilities

styles/
└── globals.css               # Design tokens & theme
```

## Feature Implementation Details

### Email Signup Flow
1. **Email Entry** (`/auth/signup/email`):
   - Validates email format with helpful error messages
   - Disables button until email is valid
   - Calls `mockSendEmailVerification()` with 800-1200ms delay

2. **Email Verification** (`/auth/signup/email/verify`):
   - Full-screen loader showing "Verifying email..."
   - Success redirects to password page after 1.5s
   - Failure shows error modal with "Return to Home" button
   - 5% chance of simulated failure for testing error states

### Phone Signup Flow
1. **Phone Entry** (`/auth/signup/phone`):
   - Accepts phone numbers in multiple formats
   - Prepends +237 country code automatically
   - Calls `mockSendOTP()` with 800-1200ms delay

2. **OTP Verification** (`/auth/signup/phone/otp`):
   - 6-digit input with auto-focus to next field on number entry
   - Paste support for full OTP
   - Auto-validates when all 6 digits entered
   - "Resend in 10s" countdown timer
   - Demo OTP: "123456" always works, otherwise 85% success rate

### Password Creation (`/auth/signup/password`)
- Real-time validation with specific error messages:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- Password strength indicator
- Toggle visibility buttons for both fields
- 500-1000ms mock delay

### Career Selection (`/auth/signup/career`)
- 6 role options: Student, Employed, Self-employed, Job Seeker, Business Man, Other
- Button group with selected state styling
- 300-500ms mock delay

### Success Page (`/auth/signup/success`)
- Animated checkmark icon
- Two CTAs: "Complete Profile" and "Start Browsing"
- Clears form data from localStorage on navigation
- Success redirect happens 500ms after role selection

## Performance Monitoring

### Web Vitals Dashboard (`/analytics`)
Displays real-time metrics:
- **LCP** (Largest Contentful Paint): Target < 2.5s
- **FID** (First Input Delay): Target < 100ms
- **CLS** (Cumulative Layout Shift): Target < 0.1
- **FCP** (First Contentful Paint): Target < 1.8s
- **TTFB** (Time to First Byte): Response time tracking

Features:
- Charts showing metrics over 24h/7d/30d periods
- Distribution analysis (Good/Need Improvement/Poor)
- Performance score calculation (0-100)
- Export capability via localStorage
- Automatic collection via `web-vitals` library

### Load Testing Dashboard (`/load-test`)
Simulate concurrent users with predefined scenarios:
- **Light**: 10 users, 30s duration
- **Moderate**: 50 users, 60s duration
- **Heavy**: 100 users, 120s duration
- **Extreme**: 500 users, 180s duration
- **Spike**: 1000 users, 60s duration

Metrics Collected:
- Total/successful/failed requests
- Average response time (with min/max)
- P95 and P99 percentiles
- Requests per second (throughput)
- Error rate percentage

## Design System

### Color Palette
- **Primary**: `#0047AB` (Deep Blue) - Main CTA and focus states
- **Secondary**: `#7C3AED` (Purple) - Accent elements
- **Accent**: `#F59E0B` (Amber) - Highlights
- **Neutral**: Grayscale for text and backgrounds

### Typography
- **Font Family**: Geist (sans-serif) for both headings and body
- **Line Height**: 1.6 (relaxed) for body text
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Component States
- **Inactive**: Gray background, disabled cursor, no hover effect
- **Active**: Primary blue background, white text
- **Loading**: Blue background + spinner animation
- **Error**: Red border + error text below input
- **Hover**: Darker shade of primary color

## State Management

### SignupContext
Stores form data across all pages:
```typescript
{
  email?: string
  phone?: string
  password?: string
  role?: string
  userId?: string
  verificationMethod?: 'email' | 'phone'
}
```

### LocalStorage Persistence
- Saves form state under key: `itamba_signup_form`
- Recovers on page reload/browser restart
- Cleared on successful signup
- Max 1 session stored at a time

## Form Validation

All forms use Zod schemas for type-safe validation:
- **Email**: Valid email format required
- **Phone**: 9+ digit numbers accepted
- **Password**: 8+ chars, uppercase, lowercase, number required
- **OTP**: Exactly 6 digits
- **Role**: Non-empty string required

Real-time validation on blur, error text displayed inline.

## Error Handling

### Input Validation Errors
- Red border on input field
- Error message below input
- Button disabled until corrected

### Network/System Errors
- Toast notifications (top-right, auto-dismiss)
- Email verification failures: Modal with retry + home button
- Form submission failures: Toast with retry option

### Error Boundary
- Catches unhandled React errors
- Shows helpful error page with retry button
- Dev mode shows error details, production hides them

## Performance Optimization Checklist

### Initial Load (< 2s LCP)
- [x] Next.js Image for background with lazy loading
- [x] Route-based code splitting
- [x] CSS extracted from JS (Tailwind)
- [x] Font loading optimized (Google Fonts subsets)
- [x] No external dependencies on initial load

### Runtime (< 100ms FID)
- [x] Lightweight form validation (Zod)
- [x] Minimal re-renders via Context
- [x] No heavy animations on interaction
- [x] Debounced input handlers

### Cumulative Layout Shift (< 0.1 CLS)
- [x] Fixed button heights (h-12)
- [x] Defined input sizes
- [x] No surprise layout changes
- [x] Skeleton loaders instead of popping elements

### Mobile Performance
- [x] Touch-friendly buttons (44px minimum)
- [x] Proper viewport meta tag
- [x] Mobile-optimized images (responsive sizes)
- [x] No horizontal scrolling
- [x] Fast tap response (no 300ms delay)

## Testing the Application

### Manual Testing Flow
1. Go to `/auth/signup`
2. Choose email or phone
3. Enter test data:
   - Email: any valid email format
   - Phone: any 9+ digit number
   - Password: MyPassword123 (meets all requirements)
   - OTP: 123456 (will always succeed)
   - Career: Select any role

### Performance Testing
1. Open DevTools → Performance tab
2. Record while signing up
3. Check Lighthouse score in home page
4. View detailed metrics at `/analytics`

### Load Testing
1. Go to `/load-test`
2. Select "Moderate" scenario (50 users)
3. Click "Run Load Test"
4. View results and charts

## AWS Deployment Notes

Since you're deploying with AWS (not Vercel), note:
- **Vercel Analytics**: Works via `web-vitals` library injected in layout
- **Custom Analytics**: Stored in localStorage, accessible at `/analytics`
- **Load Testing**: Runs client-side, no server dependency

For AWS deployment:
```bash
# Build and test locally
npm run build
npm run start

# Deploy to AWS (CloudFront + ECS/Lambda)
# Ensure environment variables are set
# DATABASE_URL (if adding backend later)
# API_ENDPOINT (for real API calls)
```

## Future Enhancements

1. **Database Integration**:
   - Neon or AWS RDS for user storage
   - Real email verification links
   - Real OTP sending via Twilio

2. **Authentication**:
   - JWT session tokens
   - Password hashing (bcrypt)
   - Rate limiting on signup

3. **Additional Features**:
   - Profile completion flow
   - Email preferences
   - Social login integration
   - Two-factor authentication

4. **Monitoring**:
   - Server-side error tracking (Sentry)
   - Analytics backend (Plausible/Mixpanel)
   - Uptime monitoring

## Commands

```bash
# Development
npm run dev                # Start dev server on :3000
npm run build             # Build for production
npm run start             # Start production server
npm run lint              # Run ESLint

# Performance
npm run analyze           # Bundle size analysis
npm run lighthouse        # Local lighthouse audit
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Accessibility

- Semantic HTML (form, labels, buttons)
- ARIA labels for icons
- Keyboard navigation (Tab through form)
- Color contrast meets WCAG AA
- Focus visible on all interactive elements
- Error messages linked to inputs

---

**Build Date**: 2026-02-16  
**Status**: Ready for development and load testing
