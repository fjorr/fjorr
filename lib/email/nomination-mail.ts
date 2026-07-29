import 'server-only';

import { absoluteUrl } from '@/lib/site';
import { sendPostmarkEmail } from '@/lib/email/postmark';
import type { NominationStatus } from '@/lib/nomination-actions';

/** Statuses that trigger a member email. Skip received + in_review. */
export const EMAILABLE_NOMINATION_STATUSES: NominationStatus[] = [
  'shortlisted',
  'passed',
  'in_production',
  'released',
];

export function shouldEmailNominationStatus(
  status: NominationStatus
): boolean {
  return EMAILABLE_NOMINATION_STATUSES.includes(status);
}

function storyPreview(story: string) {
  const trimmed = story.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 100) return trimmed;
  return `${trimmed.slice(0, 97).trimEnd()}…`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type MailCopy = {
  subject: string;
  headline: string;
  body: string;
  tag: string;
};

function copyForStatus(input: {
  status: NominationStatus;
  statusReason?: string | null;
  bountyTitle?: string | null;
  awarded?: boolean;
}): MailCopy | null {
  const reason = (input.statusReason || '').trim();

  if (input.awarded) {
    const bounty = (input.bountyTitle || '').trim();
    return {
      subject: bounty
        ? `Your nomination won — ${bounty}`
        : 'Your nomination was awarded',
      headline: 'Awarded.',
      body: bounty
        ? `Your pitch was shortlisted and filled the ${bounty} bounty. We’ll be in touch about next steps.`
        : 'Your pitch was shortlisted and awarded. We’ll be in touch about next steps.',
      tag: 'nomination-awarded',
    };
  }

  switch (input.status) {
    case 'shortlisted':
      return {
        subject: 'Your nomination is shortlisted',
        headline: 'Shortlisted.',
        body: 'Your pitch made the shortlist. We’re deciding what to make next.',
        tag: 'nomination-shortlisted',
      };
    case 'passed':
      return {
        subject: 'Update on your nomination',
        headline: 'Passed.',
        body: reason
          ? `We’re not moving forward with this one.\n\n${reason}`
          : 'We’re not moving forward with this one. Thank you for pitching.',
        tag: 'nomination-passed',
      };
    case 'in_production':
      return {
        subject: 'Your nomination is in production',
        headline: 'In production.',
        body: 'We’re making it. Credit details come when the film is ready.',
        tag: 'nomination-in-production',
      };
    case 'released':
      return {
        subject: 'Your nomination is out — the film is live',
        headline: 'Released.',
        body: 'The film is live on Fjorr. Your name is in the credits.',
        tag: 'nomination-released',
      };
    default:
      return null;
  }
}

function renderEmail(input: {
  headline: string;
  body: string;
  preview: string;
}) {
  const accountUrl = absoluteUrl('/account/nominations');
  const bodyHtml = escapeHtml(input.body).replace(/\n/g, '<br />');
  const preview = escapeHtml(input.preview);

  const text = [
    input.headline,
    '',
    input.body,
    '',
    `Your pitch: ${input.preview}`,
    '',
    `Track status: ${accountUrl}`,
    '',
    '— Fjorr',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#1F1F1F;color:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:48px 24px;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(245,245,247,0.4);">Fjorr</p>
    <h1 style="margin:0 0 20px;font-size:28px;line-height:1.1;font-weight:700;letter-spacing:-0.03em;">${escapeHtml(input.headline)}</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:rgba(245,245,247,0.7);">${bodyHtml}</p>
    <p style="margin:0 0 28px;font-size:13px;line-height:1.5;color:rgba(245,245,247,0.4);">Your pitch<br /><span style="color:rgba(245,245,247,0.65);">${preview}</span></p>
    <p style="margin:0;">
      <a href="${accountUrl}" style="display:inline-block;padding:12px 20px;background:#F5F5F7;color:#1F1F1F;text-decoration:none;font-size:14px;font-weight:600;border-radius:999px;">View nominations</a>
    </p>
  </div>
</body>
</html>`;

  return { text, html };
}

export type NominationMailPayload = {
  to: string;
  status: NominationStatus;
  storyDetails: string;
  statusReason?: string | null;
  bountyTitle?: string | null;
  /** Award path — shortlisted + bounty filled. */
  awarded?: boolean;
};

/** Send a status email. Never throws — admin actions should not fail on mail. */
export async function sendNominationStatusEmail(
  payload: NominationMailPayload
): Promise<void> {
  if (!payload.awarded && !shouldEmailNominationStatus(payload.status)) {
    return;
  }

  const copy = copyForStatus({
    status: payload.status,
    statusReason: payload.statusReason,
    bountyTitle: payload.bountyTitle,
    awarded: payload.awarded,
  });
  if (!copy) return;

  const preview = storyPreview(payload.storyDetails || '');
  const { text, html } = renderEmail({
    headline: copy.headline,
    body: copy.body,
    preview,
  });

  await sendPostmarkEmail({
    To: payload.to,
    Subject: copy.subject,
    TextBody: text,
    HtmlBody: html,
    Tag: copy.tag,
  });
}
