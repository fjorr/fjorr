import 'server-only';

export type PostmarkMessage = {
  To: string;
  Subject: string;
  TextBody: string;
  HtmlBody: string;
  MessageStream?: string;
  Tag?: string;
};

type PostmarkResult =
  | { ok: true; messageId: string }
  | { ok: false; skipped?: boolean; error: string };

/** Low-level Postmark send. No-ops (ok:false, skipped) if token is missing. */
export async function sendPostmarkEmail(
  message: PostmarkMessage
): Promise<PostmarkResult> {
  const token = process.env.POSTMARK_SERVER_TOKEN?.trim();
  const from =
    process.env.POSTMARK_FROM_EMAIL?.trim() || 'Fjorr <intel@fjorr.com>';

  if (!token) {
    console.warn('[postmark] POSTMARK_SERVER_TOKEN missing — email skipped');
    return { ok: false, skipped: true, error: 'POSTMARK_SERVER_TOKEN missing' };
  }

  const to = message.To.trim().toLowerCase();
  if (!to || !to.includes('@')) {
    return { ok: false, error: 'Invalid recipient' };
  }

  try {
    const res = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': token,
      },
      body: JSON.stringify({
        From: from,
        To: to,
        Subject: message.Subject,
        TextBody: message.TextBody,
        HtmlBody: message.HtmlBody,
        MessageStream: message.MessageStream || 'outbound',
        Tag: message.Tag,
      }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      MessageID?: string;
      Message?: string;
      ErrorCode?: number;
    };

    if (!res.ok) {
      const err =
        body.Message || `Postmark HTTP ${res.status}`;
      console.error('[postmark] send failed:', err);
      return { ok: false, error: err };
    }

    return { ok: true, messageId: String(body.MessageID || '') };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Postmark request failed';
    console.error('[postmark] send error:', msg);
    return { ok: false, error: msg };
  }
}
