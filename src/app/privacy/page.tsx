import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/legal";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Xirevoa collects, how your photos are handled, and how to have your data deleted.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      intro="Xirevoa is a virtual fitting room: you share a photo of yourself, and we show you wearing clothes or a new haircut. That makes your photos the most sensitive thing we handle, so this page says plainly what we collect, what happens to it, and how to have it removed."
    >
      <Section title="Who we are">
        <p>
          Xirevoa, backed by Loopwar.dev, is based at Besarda, Tiba Basai, Jhunjhunu, Rajasthan
          333036, India. For anything on this page, including deletion requests and complaints,
          write to <a href="mailto:contact@xirevoa.com">contact@xirevoa.com</a>.
        </p>
      </Section>

      <Section title="What we collect">
        <ul>
          <li>
            <strong>Your account:</strong> your email address and username. If you sign up with a
            password we store only a one-way hash of it, never the password itself. If you use
            Google sign-in we receive your name, email and profile picture from Google.
          </li>
          <li>
            <strong>Images we generate for you:</strong> the try-on and haircut results you create,
            and whether you have shared them by link or posted them to the public feed.
          </li>
          <li>
            <strong>XPoints and payments:</strong> your balance and a record of every credit and
            debit. Payments are handled by Razorpay. We keep the order reference, amount and
            status, and never see or store your card, UPI or bank details.
          </li>
          <li>
            <strong>Abuse prevention:</strong> when a new account claims its free XPoints we store a
            hashed fingerprint of the device and a hashed version of the IP address, so the same
            device can&apos;t claim the bonus repeatedly. We never store your raw IP address for this.
          </li>
          <li>
            <strong>Brand accounts:</strong> for stores using our try-on button, the brand name,
            website, and a log of each try-on: the product page, product name, and whether the
            shopper went on to add it to their cart. This log does not identify the shopper.
          </li>
        </ul>
      </Section>

      <Section id="photos" title="How we handle your photos">
        <ul>
          <li>
            When you upload a photo, it is shrunk on your own device first and then sent to
            Google&apos;s Gemini image model, which creates the result. Google processes it under its
            API terms to return the image to us.
          </li>
          <li>
            <strong>We do not keep the photo you upload.</strong> Only the generated result is
            stored, on our servers in Mumbai, India.
          </li>
          <li>
            Generated images are private. They are not listed anywhere and can only be opened with
            their unguessable link.
          </li>
          <li>
            Nothing becomes public unless you choose to. Sharing a link and posting to the public
            feed are two separate choices, both off by default, and you can undo either at any
            time from your Looks.
          </li>
          <li>
            Your recent uploads appear in the Studio for convenience. They are kept in your own
            browser, not on our servers, and clearing your browser data removes them.
          </li>
          <li>
            We never sell your photos, never use them in advertising, and never use them to train
            our own models.
          </li>
          <li>
            <strong>On a store&apos;s website:</strong> when you use a “Try it on” button powered by
            Xirevoa, your photo is used only to create your preview. The store never sees your
            photo or the result.
          </li>
        </ul>
      </Section>

      <Section title="How we use your information">
        <ul>
          <li>To run the service: sign you in, generate your images, and keep your Looks.</li>
          <li>To send sign-in codes and essential account emails. We don&apos;t send marketing email.</li>
          <li>To process payments and keep an accurate XPoints balance.</li>
          <li>To prevent fraud and abuse of free credits.</li>
        </ul>
      </Section>

      <Section title="Who we share it with">
        <p>
          Only the services needed to run Xirevoa: Google (the Gemini image model, Google sign-in,
          and email delivery), Google Cloud (our servers, in Mumbai) and Razorpay (payments). We
          don&apos;t use advertising networks or third-party analytics trackers, and we don&apos;t sell
          personal data to anyone.
        </p>
      </Section>

      <Section title="Cookies and local storage">
        <p>
          We use one essential cookie to keep you signed in. Your theme, notifications and recent
          photos are kept in your browser&apos;s local storage on your device. There are no tracking
          or advertising cookies.
        </p>
      </Section>

      <Section title="Keeping and deleting your data">
        <p>
          We keep your account and your Looks for as long as your account is open. To delete your
          account, or any specific image, email{" "}
          <a href="mailto:contact@xirevoa.com">contact@xirevoa.com</a> from the address you signed
          up with. We will delete it within 30 days and confirm when it&apos;s done. Payment records
          may be kept longer where Indian tax and accounting law requires it.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Under India&apos;s Digital Personal Data Protection Act, 2023, you can ask us what personal
          data we hold about you, ask us to correct or erase it, and withdraw your consent. You can
          also raise a grievance with us, and if we don&apos;t resolve it, with the Data Protection
          Board of India. Write to <a href="mailto:contact@xirevoa.com">contact@xirevoa.com</a> and
          we will respond within 30 days.
        </p>
      </Section>

      <Section title="Age">
        <p>
          Xirevoa is for people aged 18 and over. Please don&apos;t upload photos of children.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          If we change how we handle your data, we will update this page and the date at the top.
          If a change is significant, we will tell you by email before it takes effect.
        </p>
      </Section>
    </LegalPage>
  );
}
