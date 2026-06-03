'use server';

import { createClient } from '@supabase/supabase-js';

export type FormState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

export async function subscribeToNewsletter(prevState: FormState, formData: FormData): Promise<FormState> {
  // 1. 🍯 Honeypot bot protection
  const botTrap = formData.get('website_source_confirm');
  if (botTrap && botTrap.toString().length > 0) {
    return { status: 'success', message: "Welcome to Fjorr. You're in." };
  }

  const email = formData.get('email')?.toString().trim();

  // 2. Empty check
  if (!email) {
    return { status: 'error', message: 'Email required' };
  }

  // 3. Syntax regex check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { status: 'error', message: 'That email looks a bit off.' };
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration environment keys.');
      return { status: 'error', message: 'Configuration error. Try again later.' };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Duplication check
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
      return { status: 'error', message: 'Email is already in.' };
    }

    // 5. Save tracking row
    // 🎯 THE FIX: Changed status value from 'active' to 'subscribed' to clear your database check constraint
    const { error: insertError } = await supabase
      .from('intel_list')
      .insert([
        { 
          email: email, 
          source: 'footer', 
          status: 'subscribed' 
        }
      ]);

    if (insertError) {
      console.error('❌ Supabase Insertion Rejection Error Details:', insertError.message);
      return { status: 'error', message: `Database error: ${insertError.message}` };
    }

    return { status: 'success', message: "Welcome to Fjorr. You're in." };

  } catch (error) {
    console.error('Newsletter mutation error catch block:', error);
    return { status: 'error', message: 'Something went wrong. Try again.' };
  }
}