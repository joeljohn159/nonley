import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="mb-10 inline-block">
          <img src="/logo-text.png" alt="Nonley" className="h-6 w-auto" />
        </Link>

        <h1 className="mb-2 text-2xl font-semibold text-neutral-900">
          Privacy Policy
        </h1>
        <p className="mb-10 text-sm text-neutral-400">
          Last updated: March 27, 2026
        </p>

        <div className="space-y-8 text-[14px] leading-relaxed text-neutral-700">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              1. Introduction
            </h2>
            <p>
              Nonley ("we," "our," or "us") operates the Nonley web application,
              browser extension, and related services (collectively, the
              "Service"). This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our Service.
              We are committed to protecting your privacy and handling your data
              in an open and transparent manner.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              2. Information We Collect
            </h2>
            <h3 className="mb-2 font-medium text-neutral-800">
              2.1 Account Information
            </h3>
            <p className="mb-3">
              When you create an account, we collect your email address, display
              name, and profile avatar through OAuth providers (Google, GitHub)
              or email-based authentication. We do not store passwords.
            </p>
            <h3 className="mb-2 font-medium text-neutral-800">
              2.2 Presence Data
            </h3>
            <p className="mb-3">
              Our Service detects which webpage you are visiting to show
              co-presence with other users. We never store your raw URLs. All
              URLs are hashed using SHA-256 before transmission to our servers.
              This means we cannot reconstruct or view the actual pages you
              visit. Only the one-way cryptographic hash is stored, and only for
              the duration of your active session.
            </p>
            <h3 className="mb-2 font-medium text-neutral-800">
              2.3 Chat and Communication Data
            </h3>
            <p className="mb-3">
              Room-based chat messages are ephemeral and are not stored in any
              database. Direct messages between friends are stored encrypted and
              can be deleted by either party. Voice and video calls are
              peer-to-peer (WebRTC) and are not routed through or recorded by
              our servers.
            </p>
            <h3 className="mb-2 font-medium text-neutral-800">
              2.4 Usage Data
            </h3>
            <p>
              We may collect anonymous, aggregated usage statistics such as
              connection counts and feature usage patterns. This data cannot be
              used to identify individual users.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              3. HIPAA Compliance
            </h2>
            <p className="mb-3">
              Nonley is designed with privacy-first principles consistent with
              the Health Insurance Portability and Accountability Act (HIPAA)
              standards:
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong>No Protected Health Information (PHI):</strong> We do
                not collect, store, process, or transmit any health-related data
                or protected health information.
              </li>
              <li>
                <strong>Encryption at rest and in transit:</strong> All data is
                encrypted using AES-256-GCM at rest and TLS 1.3 in transit.
                Integration tokens and sensitive credentials are encrypted
                before storage.
              </li>
              <li>
                <strong>Access controls:</strong> Role-based access controls
                limit data access to authorized personnel only. Administrative
                actions are logged in an audit trail.
              </li>
              <li>
                <strong>Data minimization:</strong> We collect only the minimum
                data necessary to provide the Service. URLs are hashed (SHA-256)
                and never stored in plaintext. Ephemeral data is automatically
                purged when sessions end.
              </li>
              <li>
                <strong>Secure authentication:</strong> No passwords are stored.
                Authentication is handled through OAuth 2.0 providers or
                cryptographic magic links. JWT tokens expire within 24 hours.
              </li>
              <li>
                <strong>Breach notification:</strong> In the event of a data
                breach, we will notify affected users within 72 hours in
                compliance with applicable regulations.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              4. How We Use Your Information
            </h2>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                To provide and maintain the Service, including real-time
                presence features
              </li>
              <li>To authenticate your identity and manage your account</li>
              <li>
                To facilitate connections between users on the same webpage
              </li>
              <li>
                To enable friend requests, messaging, and calling features
              </li>
              <li>To enforce rate limits and prevent abuse</li>
              <li>To improve and optimize the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              5. Data Sharing and Disclosure
            </h2>
            <p className="mb-3">
              We do not sell, rent, or trade your personal information. We may
              share data only in the following circumstances:
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong>With your consent:</strong> When you choose to share
                your presence or profile with other users based on your privacy
                settings.
              </li>
              <li>
                <strong>Service providers:</strong> With trusted third-party
                providers who assist in operating our Service (e.g., hosting,
                database), bound by confidentiality agreements.
              </li>
              <li>
                <strong>Legal requirements:</strong> When required by law,
                regulation, legal process, or governmental request.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              6. Data Retention
            </h2>
            <p>
              Presence data is ephemeral and deleted when you leave a page or
              disconnect. Friend messages are retained until deleted by a user
              or until account deletion. Account data is retained until you
              request deletion. You may export all your data or permanently
              delete your account at any time through the Settings page.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              7. Your Rights
            </h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>Access and export your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and all associated data</li>
              <li>Control your visibility on a per-site basis</li>
              <li>Opt out of presence tracking using Focus Mode</li>
              <li>Withdraw consent at any time by deleting your account</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              8. Security Measures
            </h2>
            <ul className="ml-5 list-disc space-y-2">
              <li>All connections use HTTPS/WSS encryption</li>
              <li>CORS policies restrict access to authorized domains only</li>
              <li>
                Rate limiting protects against abuse (100 req/min standard, 10
                req/min auth)
              </li>
              <li>
                XSS prevention through React escaping and DOMPurify sanitization
              </li>
              <li>
                The browser extension requests minimal permissions (activeTab,
                storage only)
              </li>
              <li>
                Integration tokens are encrypted with AES-256-GCM before
                database storage
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              9. Children's Privacy
            </h2>
            <p>
              The Service is not intended for users under the age of 13. We do
              not knowingly collect personal information from children under 13.
              If we become aware that a child under 13 has provided us with
              personal data, we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new policy on
              this page and updating the "Last updated" date. Your continued use
              of the Service after such changes constitutes acceptance of the
              updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              11. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy or our data
              practices, please contact us at{" "}
              <a
                href="mailto:privacy@nonley.com"
                className="text-[#2a7b8f] hover:underline"
              >
                privacy@nonley.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-16 border-t border-neutral-200 pt-6 text-center text-[12px] text-neutral-400">
          <div className="flex items-center justify-center gap-4">
            <Link href="/terms" className="hover:text-neutral-600">
              Terms of Service
            </Link>
            <span>|</span>
            <Link href="/disclaimer" className="hover:text-neutral-600">
              Disclaimer
            </Link>
            <span>|</span>
            <Link href="/" className="hover:text-neutral-600">
              Back to App
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
