# 🌿 Green Nest - PRD Part 2: Authentication & User Profiles

## 1. User Registration & Sign-Up

### 1.1 Customer Registration Flow
*   **Fields Required:** Full Name, Email Address, Password, Password Confirmation.
*   **Validation Rules:**
    *   `email`: Must conform to valid RFC 5322 structure.
    *   `password`: Minimum 8 characters, containing at least 1 uppercase letter, 1 lowercase letter, 1 numeric digit, and 1 special symbol.
*   **Process Execution:**
    1.  User enters credentials in the glassmorphic registration panel.
    2.  Next.js client sends credentials to Supabase Auth API (`auth.signUp()`).
    3.  A row is automatically written to Supabase's internal auth table, triggering `public.handle_new_user()` which inserts a duplicate reference row into `public.profiles` with the role set to `'customer'`.
    4.  An email verification message is dispatched to the user. The app renders a translucent confirmation banner requesting email validation.

```
  +-------------------------------------------------------------+
  |              [Registration Form Component]                  |
  |                                                             |
  |   Full Name:   [ Jane Doe                           ]       |
  |   Email:       [ janedoe@example.com                ]       |
  |   Password:    [ •••••••••••••                      ]       |
  |                                                             |
  |   [ Register Account (Fades into loader animation) ]       |
  +-------------------------------------------------------------+
```

---

## 2. User Sign-In & Login

The login panel supports two authentication mechanisms: Standard Credentials and Federated Social Logins.

### 2.1 Credentials Sign-In
*   **Input Fields:** Email, Password.
*   **Execution:** Next.js client invokes `supabase.auth.signInWithPassword()`. If successful, the client receives a JWT and a refresh token, stored securely in HTTP-only cookies or localStorage with automatic context wrapper propagation.

### 2.2 Google OAuth Login
*   **Interaction:** Clicking the brand-styled Google Button triggers:
    ```typescript
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    ```
*   **Redirect handling:** Upon successful authentication, the user is routed to `/auth/callback`, which reads the authorization code, hydrates the session parameters, verifies the existence of their `public.profiles` record, and forwards them to the client homepage.

---

## 3. Session & Token Management

```
  +---------------+               +-----------------+               +-------------------+
  |               |  (1) JWT Auth |                 | (2) Verify    |                   |
  |  Client App   +-------------->+  Express Server +-------------->+  Supabase DB      |
  |  (Next.js)    |               |  API Routing    |     Token     |  (User Profiles)  |
  |               |               |                 |               |                   |
  +---------------+               +-----------------+               +-------------------+
```

### 3.1 Session Persistence
*   Sessions remain active for 7 days unless manually signed out.
*   The Next.js wrapper monitors token expirations automatically. If a token has expired, it requests a new access token using `supabase.auth.getSession()` before making API requests.

### 3.2 Express.js Auth Middleware
The Express server protects endpoints using an authentication middleware that validates incoming JWTs:
1.  Reads the header `Authorization: Bearer <JWT_TOKEN>`.
2.  If missing, returns `HTTP 401 Unauthorized`.
3.  Validates the token against the Supabase Auth signature.
4.  Decodes the payload to extract the User ID (`sub`) and role metadata.
5.  Attaches the `user` object to the request Context: `req.user = { id: payload.sub, email: payload.email, role: payload.role }`.
6.  Proceeds to endpoint handler.

---

## 4. Password Recovery & Account Validation

### 4.1 Reset Workflow
1.  **Request Reset:** User clicks "Forgot Password", enters their email, and clicks submit. The backend triggers `supabase.auth.resetPasswordForEmail()`.
2.  **Email Token:** User receives an email containing a secure link pointing to `/auth/reset-password`.
3.  **Password Replacement:** Upon loading `/auth/reset-password`, the app confirms the active session parameter and renders a glassmorphic "New Password" form. Submitting updates the credentials using `supabase.auth.updateUser()`.

---

## 5. Profile Management

Users manage their settings on `/profile`. The profile page is a split view with glassmorphic cards:

### 5.1 Profile Schema & Fields
*   **Avatar Image:** A circular image display. Clicking it opens a file selector. The client uploads the image to the `avatar-images` bucket, updates the user's `avatar_url` in the database, and displays a success notification.
*   **Personal Info Panel:** Form to update `full_name` and `phone_number`.
*   **Saved Addresses Directory:** A list where users can save multiple addresses.
    *   *Address Object:*
        ```json
        {
          "id": "uuid",
          "street_address": "123 Green Valley Lane",
          "city": "Seattle",
          "state": "WA",
          "postal_code": "98101",
          "country": "USA",
          "is_default": true
        }
        ```
*   **History Panels:** Render clickable summaries of past orders and saved AI recommendation match outputs.
