import { GlassCardLayout } from "@/components/common/GlassCardLayout";

export function PrivacyPolicyPage(): React.ReactElement {
  return (
    <GlassCardLayout viewTransitionName="privacy-policy">
      <div className="space-y-8">
        <div>
          <h1 className="text-foreground text-3xl font-semibold">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2 text-sm">Effective date: May 23, 2025</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-foreground text-xl font-semibold">1. Who we are</h2>
          <p className="text-muted-foreground">
            Storkly (<strong className="text-foreground">storkly.cc</strong>) is a gift registry and
            event planning service that lets you create registries, plan events, and share them with
            friends and family. The service is operated by the Storkly team. For any privacy-related
            questions, contact us at{" "}
            <a href="mailto:privacy@storkly.cc" className="text-primary underline">
              privacy@storkly.cc
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground text-xl font-semibold">2. Information we collect</h2>
          <p className="text-muted-foreground">
            We collect the following information when you use Storkly:
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1">
            <li>
              <strong className="text-foreground">Account information</strong> — your name and email
              address, provided either directly during registration or via a social login (Google,
              Facebook).
            </li>
            <li>
              <strong className="text-foreground">Registry content</strong> — the registries, item
              lists, categories, and notes you create.
            </li>
            <li>
              <strong className="text-foreground">Event data</strong> — events you create, including
              title, description, date, location, time slots, and RSVP responses (name, email,
              attendance status, and selected time slot) submitted by guests.
            </li>
            <li>
              <strong className="text-foreground">Usage data</strong> — standard server logs (IP
              address, browser type, pages visited) for security and debugging purposes.
            </li>
          </ul>
          <p className="text-muted-foreground">
            We do not collect payment information. Storkly does not process any payments.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground text-xl font-semibold">3. How we use your information</h2>
          <ul className="text-muted-foreground list-inside list-disc space-y-1">
            <li>To create and manage your account</li>
            <li>To provide the gift registry service (registries, item lists, gift claiming)</li>
            <li>To provide the event planning service (events, time slots, RSVP collection)</li>
            <li>
              To send transactional emails such as email verification, password reset links, and
              RSVP confirmations
            </li>
            <li>To diagnose errors and maintain security</li>
          </ul>
          <p className="text-muted-foreground">
            We do not use your data for advertising or sell it to third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground text-xl font-semibold">4. Third-party services</h2>
          <p className="text-muted-foreground">
            Storkly integrates with the following third-party services for authentication. When you
            choose to sign in with one of these providers, you are subject to their privacy
            policies:
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1">
            <li>
              <strong className="text-foreground">Google Sign-In</strong> —{" "}
              <a
                href="https://policies.google.com/privacy"
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Privacy Policy
              </a>
            </li>
            <li>
              <strong className="text-foreground">Facebook Login</strong> —{" "}
              <a
                href="https://www.facebook.com/privacy/policy/"
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Meta Privacy Policy
              </a>
            </li>
          </ul>
          <p className="text-muted-foreground">
            We only request the minimum permissions needed: your name and email address. We do not
            access your social media posts, contacts, profile picture, or any other account data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground text-xl font-semibold">5. Data sharing</h2>
          <p className="text-muted-foreground">
            We do not sell, rent, or share your personal data with third parties, except:
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1">
            <li>
              <strong className="text-foreground">Transactional email provider</strong> — we use a
              mail service to deliver verification and notification emails. Your email address is
              transmitted to this service solely for delivery purposes.
            </li>
            <li>
              <strong className="text-foreground">Legal obligations</strong> — if required by law or
              to protect the rights and safety of users.
            </li>
          </ul>
          <p className="text-muted-foreground">
            Registry and event content you share via an invite link is visible to anyone who has
            that link. RSVP responses (name, email, attendance) submitted by guests are visible to
            the event organiser. Treat invite links as you would any shared link.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground text-xl font-semibold">6. Data retention</h2>
          <p className="text-muted-foreground">
            Your account and associated data are retained for as long as your account is active. You
            may request deletion of your account and all associated data at any time by contacting{" "}
            <a href="mailto:privacy@storkly.cc" className="text-primary underline">
              privacy@storkly.cc
            </a>
            . Unverified accounts that are not activated within 24 hours are automatically deleted.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground text-xl font-semibold">7. Your rights</h2>
          <p className="text-muted-foreground">You have the right to:</p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data via your profile settings</li>
            <li>Request deletion of your account and personal data</li>
            <li>
              Withdraw consent for social login by revoking access in your Google or Facebook
              settings
            </li>
          </ul>
          <p className="text-muted-foreground">
            To exercise any of these rights, email{" "}
            <a href="mailto:privacy@storkly.cc" className="text-primary underline">
              privacy@storkly.cc
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground text-xl font-semibold">8. Cookies and local storage</h2>
          <p className="text-muted-foreground">
            Storkly uses browser memory (not cookies or localStorage) to store your authentication
            token during your session. No tracking cookies or third-party analytics cookies are set.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground text-xl font-semibold">9. Security</h2>
          <p className="text-muted-foreground">
            We use industry-standard practices including HTTPS encryption in transit and hashed
            password storage. No system is completely secure — if you believe you have found a
            security issue, please contact{" "}
            <a href="mailto:privacy@storkly.cc" className="text-primary underline">
              privacy@storkly.cc
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground text-xl font-semibold">10. Changes to this policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. When we do, we will update the
            effective date at the top of this page. Continued use of Storkly after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-foreground text-xl font-semibold">11. Contact</h2>
          <p className="text-muted-foreground">
            For any questions about this Privacy Policy, contact us at{" "}
            <a href="mailto:privacy@storkly.cc" className="text-primary underline">
              privacy@storkly.cc
            </a>
            .
          </p>
        </section>
      </div>
    </GlassCardLayout>
  );
}
