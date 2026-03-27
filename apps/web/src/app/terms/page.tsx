import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="mb-10 inline-block">
          <img src="/logo-text.png" alt="Nonley" className="h-6 w-auto" />
        </Link>

        <h1 className="mb-2 text-2xl font-semibold text-neutral-900">
          Terms of Service
        </h1>
        <p className="mb-10 text-sm text-neutral-400">
          Last updated: March 27, 2026
        </p>

        <div className="space-y-8 text-[14px] leading-relaxed text-neutral-700">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Nonley ("the Service"), you agree to be
              bound by these Terms of Service ("Terms"). If you do not agree to
              these Terms, you may not access or use the Service. These Terms
              constitute a legally binding agreement between you and Nonley.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              2. Description of Service
            </h2>
            <p>
              Nonley provides a real-time presence layer for the internet,
              allowing users to see who else is viewing the same webpage, video,
              song, or application at the same time. The Service includes a web
              application, browser extension, embeddable widget, and related
              APIs. All presence detection is performed using privacy-preserving
              URL hashing.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              3. User Accounts
            </h2>
            <p className="mb-3">
              To use the Service, you must create an account using a supported
              authentication method (Google, GitHub, or email magic link). You
              are responsible for maintaining the security of your account. You
              agree to:
            </p>
            <ul className="ml-5 list-disc space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Not create accounts for fraudulent or misleading purposes</li>
              <li>Not share your account with others</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              4. Acceptable Use
            </h2>
            <p className="mb-3">You agree not to use the Service to:</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>Harass, bully, threaten, or intimidate other users</li>
              <li>
                Send spam, unsolicited messages, or engage in abusive behavior
              </li>
              <li>Impersonate another person or entity</li>
              <li>Transmit malware, viruses, or any harmful code</li>
              <li>
                Attempt to gain unauthorized access to the Service or other
                users' accounts
              </li>
              <li>
                Interfere with or disrupt the Service or its infrastructure
              </li>
              <li>
                Scrape, data-mine, or collect information about other users
                without consent
              </li>
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Stalk, track, or monitor other users' browsing activity</li>
              <li>
                Circumvent rate limits, privacy controls, or security measures
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              5. User Content
            </h2>
            <p>
              You retain ownership of any content you submit through the Service
              (messages, profile information, etc.). By submitting content, you
              grant Nonley a limited, non-exclusive license to transmit and
              display that content solely for the purpose of providing the
              Service. Room chat messages are ephemeral and not permanently
              stored. Direct messages are stored encrypted and can be deleted at
              any time.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              6. Privacy
            </h2>
            <p>
              Your use of the Service is also governed by our{" "}
              <Link href="/privacy" className="text-[#2a7b8f] hover:underline">
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference. Please
              review our Privacy Policy to understand how we collect, use, and
              protect your information.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              7. Subscription Plans
            </h2>
            <p>
              Nonley offers free and paid subscription tiers. Paid features are
              billed through Stripe. You may cancel your subscription at any
              time. Refunds are handled on a case-by-case basis. We reserve the
              right to modify pricing with 30 days advance notice. Free tier
              features may be subject to usage limits.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              8. Intellectual Property
            </h2>
            <p>
              The Service, including its design, code, logos, and trademarks, is
              owned by Nonley and protected by intellectual property laws. You
              may not copy, modify, distribute, sell, or lease any part of the
              Service without our written permission. The Nonley name and logo
              are registered trademarks.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              9. Termination
            </h2>
            <p>
              We may suspend or terminate your access to the Service at any
              time, with or without cause, with or without notice. You may
              delete your account at any time through the Settings page. Upon
              termination, your right to use the Service ceases immediately.
              Data deletion is handled in accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              10. Disclaimer of Warranties
            </h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
              WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT
              NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR
              A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT
              THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              11. Limitation of Liability
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NONLEY SHALL NOT BE LIABLE
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
              DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
              DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR
              OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR ACCESS TO OR USE
              OF OR INABILITY TO ACCESS OR USE THE SERVICE; (B) ANY CONDUCT OR
              CONTENT OF ANY THIRD PARTY ON THE SERVICE; (C) ANY CONTENT
              OBTAINED FROM THE SERVICE; OR (D) UNAUTHORIZED ACCESS, USE, OR
              ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              12. Indemnification
            </h2>
            <p>
              You agree to indemnify, defend, and hold harmless Nonley and its
              officers, directors, employees, and agents from and against any
              claims, damages, obligations, losses, liabilities, costs, or debt
              arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              13. Governing Law
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of the jurisdiction in which Nonley operates, without
              regard to its conflict of law provisions. Any disputes arising
              under these Terms shall be resolved through binding arbitration in
              accordance with applicable rules.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              14. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. Material
              changes will be communicated through the Service or via email.
              Your continued use of the Service after changes are posted
              constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              15. Contact
            </h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <a
                href="mailto:legal@nonley.com"
                className="text-[#2a7b8f] hover:underline"
              >
                legal@nonley.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-16 border-t border-neutral-200 pt-6 text-center text-[12px] text-neutral-400">
          <div className="flex items-center justify-center gap-4">
            <Link href="/privacy" className="hover:text-neutral-600">
              Privacy Policy
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
