import { redirect } from "next/navigation";
import { auth, authProviders, authReady, authRequired, signIn } from "@/auth";

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-1.99 3.02v2.54h3.22c1.88-1.74 2.99-4.29 2.99-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.42l-3.22-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.13H3.08v2.57A9.99 9.99 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.91A6.02 6.02 0 0 1 6.08 12c0-.66.11-1.31.32-1.91V7.52H3.08A10 10 0 0 0 2 12c0 1.61.39 3.14 1.08 4.48l3.32-2.57Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.83 1.5L18.68 4.6A9.58 9.58 0 0 0 12 2a9.99 9.99 0 0 0-8.92 5.52l3.32 2.57c.79-2.37 3-4.13 5.6-4.13Z"/></svg>;
}

function MicrosoftMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path fill="#f25022" d="M2 2h9.5v9.5H2z"/><path fill="#7fba00" d="M12.5 2H22v9.5h-9.5z"/><path fill="#00a4ef" d="M2 12.5h9.5V22H2z"/><path fill="#ffb900" d="M12.5 12.5H22V22h-9.5z"/></svg>;
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!authRequired) redirect("/");
  const session = await auth();
  if (session?.user) redirect("/");
  const params = await searchParams;
  const error = typeof params.error === "string";

  return <main className="auth-page">
    <section className="auth-panel">
      <div className="auth-brand"><span>O</span><strong>Orbit Base</strong></div>
      <div className="auth-copy"><small>BESTARION WORKSPACE</small><h1>Welcome back</h1><p>Sign in with your work account to access HR Operations, team OKRs and task planning.</p></div>
      {error && <div className="auth-alert" role="alert">Sign-in was not completed. Please try again or contact your workspace administrator.</div>}
      {authReady ? <div className="auth-actions">
        {authProviders.google && <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}><button type="submit"><GoogleMark /><span>Continue with Google</span></button></form>}
        {authProviders.microsoft && <form action={async () => { "use server"; await signIn("microsoft-entra-id", { redirectTo: "/" }); }}><button type="submit"><MicrosoftMark /><span>Continue with Microsoft</span></button></form>}
      </div> : <div className="auth-setup" role="status"><strong>Authentication setup required</strong><span>Add an OAuth provider and AUTH_SECRET to the deployment environment before enabling sign-in.</span></div>}
      <footer>Protected by secure OAuth · Session expires after 8 hours</footer>
    </section>
    <aside className="auth-context"><div><span>HR OPERATIONS</span><h2>One secure workspace for work and outcomes.</h2><ul><li>Shared tasks and operational views</li><li>Team and personal OKRs</li><li>Eisenhower priority planning</li></ul></div></aside>
  </main>;
}
