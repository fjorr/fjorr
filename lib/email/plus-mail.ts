import 'server-only';

import { absoluteUrl } from '@/lib/site';
import { sendPostmarkEmail } from '@/lib/email/postmark';
import { formatTimestamp } from '@/lib/film-note-time';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function previewBody(body: string) {
  const trimmed = body.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 140) return trimmed;
  return `${trimmed.slice(0, 137).trimEnd()}…`;
}

/** Quiet ack when the desk marks a Plus note as read. Never throws. */
export async function sendPlusNoteSeenEmail(input: {
  to: string;
  filmName: string | null;
  filmSlug: string | null;
  body: string;
  atSeconds: number | null;
}): Promise<void> {
  const to = (input.to || '').trim().toLowerCase();
  if (!to || !to.includes('@')) return;

  const film = (input.filmName || 'a film').trim();
  const logsUrl = absoluteUrl('/account/plus');
  const momentUrl =
    input.filmSlug && input.atSeconds != null
      ? absoluteUrl(
          `/film/${input.filmSlug}?t=${Math.floor(input.atSeconds)}`
        )
      : input.filmSlug
        ? absoluteUrl(`/film/${input.filmSlug}`)
        : logsUrl;

  const stamp =
    input.atSeconds != null
      ? ` at ${formatTimestamp(input.atSeconds)}`
      : '';
  const note = previewBody(input.body || '');

  const subject = `The desk saw your note on ${film}`;
  const headline = 'Seen.';
  const body = `Your Plus note on ${film}${stamp} reached the desk. Thank you — living films get sharper this way.`;

  const text = [
    headline,
    '',
    body,
    '',
    note ? `Your note: ${note}` : null,
    '',
    `Open: ${momentUrl}`,
    `Plus Logs: ${logsUrl}`,
    '',
    '— Fjorr',
  ]
    .filter((line) => line != null)
    .join('\n');

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#1F1F1F;color:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:48px 24px;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(245,245,247,0.4);">Fjorr · Plus</p>
    <h1 style="margin:0 0 20px;font-size:28px;line-height:1.1;font-weight:700;letter-spacing:-0.03em;">${escapeHtml(headline)}</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:rgba(245,245,247,0.7);">${escapeHtml(body)}</p>
    ${
      note
        ? `<p style="margin:0 0 28px;font-size:13px;line-height:1.5;color:rgba(245,245,247,0.4);">Your note<br /><span style="color:rgba(245,245,247,0.65);">${escapeHtml(note)}</span></p>`
        : ''
    }
    <p style="margin:0;">
      <a href="${momentUrl}" style="display:inline-block;padding:12px 20px;background:#F5F5F7;color:#1F1F1F;text-decoration:none;font-size:14px;font-weight:600;border-radius:999px;">Open moment</a>
    </p>
  </div>
</body>
</html>`;

  await sendPostmarkEmail({
    To: to,
    Subject: subject,
    TextBody: text,
    HtmlBody: html,
    Tag: 'plus-note-seen',
  });
}
