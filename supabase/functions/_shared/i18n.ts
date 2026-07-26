/** Shared locale list for Fjorr CMS translators. */

export const LOCALES = [
  'es',
  'fr',
  'it',
  'de',
  'pt',
  'sv',
  'hi',
  'ko',
  'ja',
  'zh-tw',
] as const;

export type AppLocale = (typeof LOCALES)[number];

export const LOCALE_LABEL: Record<AppLocale, string> = {
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  de: 'German',
  pt: 'Portuguese',
  sv: 'Swedish',
  hi: 'Hindi',
  ko: 'Korean',
  ja: 'Japanese',
  'zh-tw': 'Traditional Chinese',
};

export async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function asId(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

/** Manual `{ foo_id }` / `{ id }` and Database Webhook `{ record: { id } }`. */
export function resolveUuidId(
  body: Record<string, unknown>,
  idKey: string
): string | undefined {
  const direct = asId(body[idKey]) ?? asId(body.id);
  if (direct) return direct;

  const record = body.record;
  if (record && typeof record === 'object') {
    const row = record as Record<string, unknown>;
    return asId(row.id) ?? asId(row[idKey]);
  }
  return undefined;
}

export async function translateName(
  englishName: string,
  locale: AppLocale,
  kind: string
): Promise<string> {
  if (!englishName.trim()) return '';

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set');
  }

  const system = [
    `You translate a Fjorr ${kind} label into ${LOCALE_LABEL[locale]} (${locale}).`,
    'Return ONLY valid JSON: { "name": "..." }.',
    'Keep proper nouns unchanged unless a well-known localized form exists.',
    'Be concise — short UI labels, not marketing copy.',
  ].join(' ');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify({ name: englishName }) },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as { name?: string };
  const name = String(parsed.name ?? englishName).trim();
  return name || englishName;
}
