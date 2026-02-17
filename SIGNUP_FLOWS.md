# Signup Flows Documentation

## Quick Overview

### Email Flow (4 Steps)
```
/auth/signup/email
    ↓ [Enter email & verify]
/auth/signup/email/verify
    ↓ [Auto-verify with loader]
/auth/signup/password
    ↓ [Create & confirm password]
/auth/signup/career
    ↓ [Select role/career]
/auth/signup/success
```

### Phone Flow (4 Steps)
```
/auth/signup/phone
    ↓ [Enter phone number & send OTP]
/auth/signup/phone/otp
    ↓ [Enter 6-digit code]
/auth/signup/password
    ↓ [Create & confirm password]
/auth/signup/career
    ↓ [Select role/career]
/auth/signup/success
```

---

## Detailed Flow Breakdown

## EMAIL SIGNUP FLOW

### Step 1: Email Entry (`/auth/signup/email`)

**UI Elements:**
- Header: "Sign In to Itamba"
- Subtitle: "Sign in to enjoy well organized and up to date Cameroon law"
- Email input field
- Verify email button (disabled until valid email)
- Footer with Terms/Privacy links
- Link to switch to phone signup

**Validation:**
- Email format validation with Zod
- Error message: "Invalid email address"
- Real-time validation on blur

**Mock API:**
- `mockSendEmailVerification(email)` 
- Delay: 800-1200ms
- Success: Redirects to verify page
- Failure (10% chance): Toast notification "Failed to send verification email"

**Form Data:**
- Stores: `{ email, verificationMethod: 'email', userId: 'temp_user' }`

---

### Step 2: Email Verification (`/auth/signup/email/verify?token=...`)

**UI Elements:**
- Full-screen modal overlay
- Spinning loader icon
- Text: "We are verifying your email..."
- Subtext: "This may take a few moments..."

**States:**
1. **Loading** (initial):
   - Loader spinning
   - "Verifying..." message
   
2. **Success** (after 1000-2000ms):
   - Checkmark icon animation
   - "Email verified successfully!"
   - Auto-redirect to password page after 1.5s

3. **Error** (if verification fails):
   - Alert icon in red
   - Error message displayed
   - "Try Again" button
   - "Return to Home" button

**Mock API:**
- `mockVerifyEmail(token)`
- Delay: 1000-2000ms
- Success rate: 95%
- Generates: `userId` for next step

**Auto-Actions:**
- Success: Redirect to `/auth/signup/password` after 1.5s
- Error: Show modal with action buttons

---

## PHONE SIGNUP FLOW

### Step 1: Phone Entry (`/auth/signup/phone`)

**UI Elements:**
- Header: "Sign In to Itamba"
- Info box: "We recommend using your WhatsApp phone number"
- Phone input field with placeholder
- Verify button (disabled until valid)
- Footer with email switch link

**Validation:**
- Accepts 9+ digit numbers
- Auto-prepends country code (+237)
- Error messages:
  - "Please enter a valid phone number"
  - "Phone is required"
- Real-time validation on blur

**Mock API:**
- `mockSendOTP(phoneNumber)`
- Delay: 800-1200ms
- Success: "OTP sent to [number]"
- Failure (8% chance): Toast "Failed to send OTP"

**Form Data:**
- Stores: `{ phone: '+237...', verificationMethod: 'phone', userId: 'temp_user' }`

---

### Step 2: OTP Verification (`/auth/signup/phone/otp`)

**UI Elements:**
- Header: "Verify your phone number"
- Subtext: "Enter the 6 digit code sent to [phone]"
- 6 OTP input boxes (numeric only)
- Auto-submit when all 6 digits entered
- "Didn't receive code?" section with resend button
- Resend timer (starts at 60s, counts down)

**OTP Input Behavior:**
- Each field accepts 1 digit
- Backspace clears current field and moves to previous
- Arrow keys navigate between fields
- Paste support (auto-fills all 6 digits)
- Only numeric input allowed
- Auto-focuses next field after digit entry

**Validation:**
- Error state: Red border on inputs
- Error message below: "Invalid OTP. Please try again."
- Real-time validation on complete

**Mock API:**
- `mockVerifyOTP(otp, phoneNumber)`
- Delay: 500-1000ms
- Success criteria:
  - OTP "123456" always succeeds (demo OTP)
  - Other: 85% success rate
- Errors (15% chance):
  - "Invalid OTP. Please try again."
  - "Verification failed. Please try again."

**Resend Functionality:**
- Button disabled during countdown
- Timer shows "Resend in 10s" initially
- Counts down and re-enables
- Optional: Call `mockSendOTP()` again

**Auto-Actions:**
- Success: Redirect to `/auth/signup/password` after 500ms
- Error: Clear OTP input, show error message

---

## SHARED STEPS (After Email or Phone)

### Step 3: Password Creation (`/auth/signup/password`)

**UI Elements:**
- Header: "Create your password"
- Subtext: "Secure your account with a strong password."
- Create password field with eye toggle
- Confirm password field with eye toggle
- Password requirements box showing:
  - At least 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- Create password button (disabled until valid)

**Validation (Zod Schema):**
```typescript
{
  password: string (min 8, /[A-Z]/, /[a-z]/, /[0-9]/)
  confirmPassword: string (must match password)
}
```

**Error Messages:**
- "Password must be at least 8 characters"
- "Password must contain at least one uppercase letter"
- "Password must contain at least one lowercase letter"
- "Password must contain at least one number"
- "Passwords don't match"

**Eye Toggle:**
- Shows/hides password text
- Separate toggle for each field
- Icon changes from Eye to EyeOff

**Real-time Validation:**
- Validates on blur
- Updates error text as user types
- Button enables only when both fields valid

**Mock API:**
- `mockCreatePassword(userId, password)`
- Delay: 500-1000ms
- Success rate: 98%
- Returns: confirmation message

**Form Data:**
- Stores: `{ password }`
- Note: Password is NOT persisted long-term (demo only)

---

### Step 4: Career/Role Selection (`/auth/signup/career`)

**UI Elements:**
- Header: "Who are you signing up as?"
- Subtext: "Tell us your role, so we can personalized your experience."
- Grid of 6 role buttons:
  - Student
  - Employed
  - Self employed
  - Job seeker
  - Business man
  - Other
- Continue button (disabled until role selected)

**Button States:**
- **Unselected**: White background, gray border, blue hover
- **Selected**: Blue background, white text, no hover change
- **Disabled** (during load): Opacity reduced, cursor not-allowed

**Grid Layout:**
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 2 columns

**Validation:**
- At least one role must be selected
- Continue button disabled if none selected

**Mock API:**
- `mockSelectRole(userId, roleId)`
- Delay: 300-500ms
- Success rate: 100%

**Form Data:**
- Stores: `{ role: 'student' | 'employed' | ... }`

---

### Step 5: Success Page (`/auth/signup/success`)

**UI Elements:**
- Animated checkmark icon in gradient box
- Header: "Account Created"
- Subtext: "Awesome! You are set to start browsing our library."
- "Complete profile" button (primary)
- "Start browsing" link (secondary)

**Button Actions:**
- Complete profile: Routes to `/profile/complete`
- Start browsing: Routes to `/browse` and clears form data

**Effects:**
- Checkmark animates with zoom-in on load
- Buttons have hover states
- Responsive layout for mobile

**Data Cleanup:**
- `resetFormData()` called on navigation
- LocalStorage entry cleared
- Ready for new signup

---

## Loading & Error States

### Button Loading State
```
Inactive:
  - Gray background (#9CA3AF)
  - Disabled cursor
  - No hover effect

Loading:
  - Blue background
  - Spinner animation + text "Verifying..." / "Sending OTP..." etc
  - Disabled state
  - Non-clickable

Active:
  - Blue background
  - White text
  - Hover: darker blue
  - Cursor pointer
```

### Input Error State
```
Default:
  - Border: #D1D5DB (light gray)
  - Background: #F9FAFB (off-white)

Focus:
  - Border: #0047AB (blue)
  - Ring: rgba(0, 71, 171, 0.2)

Error:
  - Border: #EF4444 (red)
  - Text below: "Error message in red"
  - Ring: rgba(239, 68, 68, 0.2)

Success (optional):
  - Border: #10B981 (green)
```

### Toast Notifications
- Position: Top-right
- Auto-dismiss: 4 seconds
- Success (green): Positive feedback
- Error (red): Error messages
- Info (blue): Additional info

### Email Verification Modal
- Overlay background: rgba(0, 0, 0, 0.5)
- Modal box: White background, 8px border radius
- Centered on screen
- Loading: Spinner + "We are verifying your email..."
- Success: Checkmark + "Email verified successfully!"
- Error: Alert icon + error message + buttons

---

## Performance Metrics

### Mock API Delays

| Operation | Min Delay | Max Delay | Realistic? |
|-----------|-----------|-----------|------------|
| Send Email Verification | 800ms | 1200ms | Yes |
| Verify Email | 1000ms | 2000ms | Yes |
| Send OTP | 800ms | 1200ms | Yes |
| Verify OTP | 500ms | 1000ms | Yes |
| Create Password | 500ms | 1000ms | Yes |
| Select Role | 300ms | 500ms | Yes |

### Failure Rates

| Operation | Failure Rate | Purpose |
|-----------|-------------|---------|
| Send Email | 10% | Test error toast |
| Verify Email | 5% | Test error modal |
| Send OTP | 8% | Test error toast |
| Verify OTP | 15% | Test error recovery |
| Create Password | 2% | Edge case testing |
| Select Role | 0% | Should never fail |

---

## Testing Scenarios

### Happy Path (Email)
1. Email: "test@example.com" → Success
2. Email verification → Auto-success
3. Password: "MyPassword123" → Success
4. Role: "Student" → Success
5. Complete!

### Happy Path (Phone)
1. Phone: "675224929" → Success (converts to +237675224929)
2. OTP: "123456" → Auto-success
3. Password: "MyPassword123" → Success
4. Role: "Employed" → Success
5. Complete!

### Error Recovery (Email)
1. Email: "invalid" → Shows error
2. Correct to "valid@email.com" → Success
3. Verification fails → Error modal → Retry → Success
4. Continue as normal

### Error Recovery (OTP)
1. OTP: "000000" → Error "Invalid OTP"
2. Correct to "123456" → Success
3. Continue as normal

---

## Key Implementation Files

| File | Purpose |
|------|---------|
| `components/auth/form-input.tsx` | Reusable input with error states |
| `components/auth/otp-input.tsx` | 6-digit OTP with smart focus |
| `components/auth/role-selector.tsx` | Role button group |
| `components/auth/signup-layout.tsx` | Shared layout (sidebar + form) |
| `lib/form-validators.ts` | All Zod schemas |
| `lib/mock-api.ts` | Mock API functions with delays |
| `lib/signup-context.ts` | State management context |
| `app/auth/signup/*.tsx` | All signup pages |

---

**Ready to test!** Start at `/auth/signup` and complete the flow.
