import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Disclaimer",
};

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="mb-10 inline-block">
          <img src="/logo-text.png" alt="Nonley" className="h-6 w-auto" />
        </Link>

        <h1 className="mb-2 text-2xl font-semibold text-neutral-900">
          Disclaimer
        </h1>
        <p className="mb-10 text-sm text-neutral-400">
          Last updated: March 27, 2026
        </p>

        <div className="space-y-8 text-[14px] leading-relaxed text-neutral-700">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              General Disclaimer
            </h2>
            <p>
              The information and services provided by Nonley are on an "as is"
              and "as available" basis. Nonley makes no representations or
              warranties of any kind, express or implied, regarding the
              operation of the Service, the information, content, or materials
              included therein. You expressly agree that your use of the Service
              is at your sole risk.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              No Medical or Health Advice
            </h2>
            <p>
              Nonley is a social presence platform and does not provide medical,
              health, or therapeutic advice. The Service is not designed to
              diagnose, treat, cure, or prevent any disease or health condition.
              While Nonley adheres to HIPAA-grade security practices, the
              Service is not a healthcare application and should not be used as
              a substitute for professional medical advice, diagnosis, or
              treatment. Always seek the advice of a qualified healthcare
              provider with any questions you may have regarding a medical
              condition.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              User Interactions
            </h2>
            <p>
              Nonley is not responsible for the conduct of any user on the
              Service. We do not screen, verify, or endorse any users.
              Interactions between users are at your own risk. We strongly
              encourage users to exercise caution when communicating with others
              and to report any suspicious or inappropriate behavior. Nonley
              reserves the right to remove content and suspend accounts that
              violate our Terms of Service, but is not obligated to monitor all
              user activity.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              Third-Party Services
            </h2>
            <p>
              The Service may integrate with or link to third-party services
              (Google, GitHub, Stripe, Spotify, Steam, etc.). Nonley is not
              responsible for the privacy practices, content, or availability of
              these third-party services. Your use of third-party services is
              governed by their respective terms and privacy policies. We do not
              endorse or assume responsibility for any third-party content,
              products, or services.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              Browser Extension
            </h2>
            <p>
              The Nonley browser extension operates within the permissions
              granted by your browser. It does not modify, inject into, or alter
              the content of websites you visit. The extension renders its
              interface within an isolated Shadow DOM and requests only minimal
              permissions (activeTab and storage). However, Nonley is not
              responsible for any incompatibility or conflicts with other
              browser extensions, websites, or browser updates.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              Data Accuracy
            </h2>
            <p>
              Presence counts and user information displayed by the Service are
              provided for informational purposes only. While we strive for
              accuracy, real-time data may occasionally reflect stale
              connections, network delays, or other technical artifacts. Nonley
              does not guarantee the absolute accuracy of presence data at any
              given moment.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              Limitation of Liability
            </h2>
            <p>
              IN NO EVENT SHALL NONLEY, ITS DIRECTORS, EMPLOYEES, PARTNERS,
              AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING
              WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER
              INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF, OR
              INABILITY TO ACCESS OR USE, THE SERVICE. THIS LIMITATION APPLIES
              WHETHER THE ALLEGED LIABILITY IS BASED ON CONTRACT, TORT,
              NEGLIGENCE, STRICT LIABILITY, OR ANY OTHER BASIS, EVEN IF NONLEY
              HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              Regulatory Compliance
            </h2>
            <p>
              Nonley implements security measures consistent with industry
              standards including HIPAA, GDPR, and CCPA guidelines. However,
              compliance is an ongoing process and Nonley does not guarantee
              compliance with all regulations in all jurisdictions. Users are
              responsible for ensuring their own compliance with applicable laws
              and regulations when using the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              Changes to This Disclaimer
            </h2>
            <p>
              We reserve the right to update or modify this Disclaimer at any
              time. Changes will be effective immediately upon posting. Your
              continued use of the Service after any changes constitutes
              acceptance of the updated Disclaimer.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              Contact
            </h2>
            <p>
              If you have any questions about this Disclaimer, please contact us
              at{" "}
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
            <Link href="/terms" className="hover:text-neutral-600">
              Terms of Service
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
