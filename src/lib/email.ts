import { createTransport } from "nodemailer";
import type { NodemailerConfig } from "next-auth/providers/nodemailer";

/** The subset of what Auth.js passes to `sendVerificationRequest` that we use. */
interface VerificationRequest {
  identifier: string;
  url: string;
  provider: NodemailerConfig;
}

/**
 * The magic-link email.
 *
 * Written as a table-based HTML email on purpose: Gmail, Outlook and most
 * Indian mail clients still strip flexbox/grid, and inline styles are the only
 * thing that survives. Also ships a plain-text part, because a link-only HTML
 * email with no text alternative scores badly with spam filters.
 */
export async function magicLinkEmail(params: VerificationRequest) {
  const { identifier: email, url, provider } = params;
  const { host } = new URL(url);

  // Dev only. Auth.js stores the token hashed, so a sign-in link can never be
  // reconstructed from the database — without this there is no way to exercise
  // the flow locally without opening a real inbox. Never log this in production:
  // anyone with the log line can sign in as that user.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[auth] magic link for ${email}: ${url}`);
  }

  // Auth.js types `server` as optionally undefined, but we always configure it
  // in auth.ts — a missing transport is a boot-time config bug, not a runtime path.
  const transport = createTransport(
    provider.server as Parameters<typeof createTransport>[0],
  );
  const result = await transport.sendMail({
    to: email,
    from: provider.from,
    subject: "Your Xirevoa sign-in link",
    text: text({ url, host }),
    html: html({ url, host }),
  });

  // Throwing here is what makes Auth.js show the user an error instead of
  // cheerfully sending them to "check your email" for a mail that never arrived.
  if (result.rejected?.length) {
    throw new Error(`Email rejected for ${result.rejected.join(", ")}`);
  }
}

function html({ url, host }: { url: string; host: string }) {
  return `
<body style="margin:0;padding:0;background:#08080a;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#08080a;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:440px;background:#0e0e11;border-radius:16px;border:1px solid rgba(245,242,236,0.1);">
          <tr>
            <td style="padding:40px 40px 0;">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;letter-spacing:4px;text-transform:uppercase;color:#f5f2ec;font-weight:600;">
                <span style="color:#e8367a;">X</span>irevoa
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 0;">
              <h1 style="margin:0;font-family:Georgia,serif;font-size:30px;line-height:1.2;color:#faf8f4;font-weight:400;">
                Your fitting room is ready.
              </h1>
              <p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#948f84;">
                Tap below to sign in to Xirevoa. This link works once and expires in 24 hours.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 0;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="border-radius:999px;background:#f5f2ec;">
                    <a href="${url}" target="_blank"
                       style="display:inline-block;padding:14px 32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#08080a;text-decoration:none;border-radius:999px;">
                      Sign in to Xirevoa
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 40px;">
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#6b675f;">
                If you didn't ask to sign in to ${host}, you can safely ignore this email — nobody can access your account without this link.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>`;
}

/** Plain-text fallback. */
function text({ url, host }: { url: string; host: string }) {
  return `Your Xirevoa sign-in link

Tap to sign in — this link works once and expires in 24 hours:
${url}

If you didn't ask to sign in to ${host}, ignore this email.`;
}
