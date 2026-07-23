'use server';

import { createClient } from '@supabase/supabase-js';

export type FormState = {
  status: 'idle' | 'success' | 'error';
  /** Message key under Footer.*, or empty when idle */
  message: string;
};

export async function subscribeToNewsletter(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const botTrap = formData.get('website_source_confirm');
  if (botTrap && botTrap.toString().length > 0) {
    return { status: 'success', message: 'welcome' };
  }

  const email = formData.get('email')?.toString().trim();

  if (!email) {
    return { status: 'error', message: 'emailRequired' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { status: 'error', message: 'emailInvalid' };
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration environment keys.');
      return { status: 'error', message: 'configError' };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existingEntry, error: fetchError } = await supabase
      .from('intel_list')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      console.error('Supabase fetch query error:', fetchError.message);
      throw fetchError;
    }

    if (existingEntry) {
      return { status: 'error', message: 'alreadyIn' };
    }

    const { error: insertError } = await supabase.from('intel_list').insert([
      {
        email: email,
        source: 'footer',
        status: 'subscribed',
      },
    ]);

    if (insertError) {
      console.error('❌ Supabase Insertion Rejection Error Details:', insertError.message);
      return { status: 'error', message: 'somethingWrong' };
    }

    return { status: 'success', message: 'welcome' };
  } catch (error) {
    console.error('Newsletter mutation error catch block:', error);
    return { status: 'error', message: 'somethingWrong' };
  }
}
