// app/password/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function PasswordPage() {
  // Server Action to process the form submission
  async function handleVerify(formData: FormData) {
    'use server';
    
    const passwordInput = formData.get('password');
    const SITE_PASSWORD = process.env.SITE_PASSWORD || 'secret123'; // Store in .env

    if (passwordInput === SITE_PASSWORD) {
      const cookieStore = await cookies();
      
      // Set a secure session cookie valid for 7 days
      cookieStore.set('site-auth', 'granted', {
        httpOnly: true, // Prevents client-side XSS access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, 
        path: '/',
      });

      redirect('/'); // Redirect back to main site upon success
    }
  }

  return (
    <main className="w-full min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm p-8 bg-[#1D1D1F] border border-zinc-800 rounded-2xl space-y-6 shadow-2xl">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Protected Area</h1>
          <p className="text-xs text-zinc-400">Please enter the password to access the site.</p>
        </div>

        <form action={handleVerify} className="space-y-4">
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full px-4 py-2.5 bg-[#141416] border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-400/50 transition-colors text-sm"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-[#0A0A0C] font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-black/20"
          >
            Enter Site
          </button>
        </form>
      </div>
    </main>
  );
}