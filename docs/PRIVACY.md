# Nonley Privacy Policy

_Last updated: March 2026_

## What Nonley Does

Nonley is a browser presence service that shows you who else is on the same webpage, listening to the same song, or using the same app as you. We believe the internet should feel less lonely.

## What We Collect

### Account Information

- Email address (required for account creation)
- Display name (optional)
- Profile photo (from OAuth provider or uploaded)

### Presence Data

- Hashed URLs of pages you visit while the extension is active and you are not in Ghost mode
- We use SHA-256 hashing, which means we cannot reconstruct the actual URLs from the stored data
- Presence data is stored in memory (Redis) and deleted when you leave the page

### Activity Data (Opt-In Only)

- Spotify listening activity (only if you connect Spotify)
- Steam gaming activity (only if you connect Steam)
- Other integration data (only if you explicitly connect each service)

### Location Data (Opt-In Only)

- City-level approximate location, only if you enable it in Settings

### Chat Messages

- Whisper and room chat messages are deleted 24 hours after the session ends
- If you explicitly save a conversation, it is retained until you delete it

## What We Never Collect

- Page content (text, images, forms, passwords)
- Browsing history (URLs are hashed and ephemeral)
- Keystrokes or mouse movements
- Data from inactive tabs
- Any data while in Ghost mode or Focus mode
- Data from other applications (extension only reads the active tab URL)

## What We Never Sell

We do not sell user data of any kind to any third party. Ever. Our business model is subscriptions, not advertising.

## Data Storage and Retention

| Data Type              | Storage                | Retention              |
| ---------------------- | ---------------------- | ---------------------- |
| Active presence        | Redis (in-memory)      | Deleted on page leave  |
| Chat messages          | PostgreSQL             | 24 hours, unless saved |
| Web trail (if enabled) | PostgreSQL             | Rolling 30 days        |
| Account data           | PostgreSQL             | Until account deletion |
| Integration tokens     | PostgreSQL (encrypted) | Until disconnected     |

## Your Rights

### Right to Access

Export all your data from Settings > Export Data. Includes circles, connections, saved chats, and profile data in JSON format.

### Right to Deletion

Delete your account from Settings > Delete Account. Deletion is permanent and irreversible. All data is removed within 30 days.

### Right to Portability

Data export is available in standard JSON format.

## Cookies

We use essential cookies only:

- Session authentication cookie (HTTP-only, Secure, SameSite=Strict)
- User preference cookie (theme, focus mode schedule)
- No tracking cookies. No third-party cookies. No analytics cookies from third parties.

## Analytics

We use self-hosted analytics (Plausible or PostHog). No Google Analytics. No Facebook Pixel. No third-party tracking.

## GDPR Compliance

We comply with GDPR. Data Processing Agreements are available for enterprise customers.

## CCPA Compliance

California residents: we do not sell personal information. A "Do Not Sell My Personal Information" link is available in the website footer.

## Children

Nonley is not intended for users under 13 years of age.

## Changes

We will notify users of material changes to this policy via email and in-app notification at least 30 days before they take effect.

## Contact

For privacy questions: privacy@nonley.com
Nonley Inc., Denton, Texas, United States
