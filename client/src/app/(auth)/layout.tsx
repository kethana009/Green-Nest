export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-zinc-950">
      {/* Ambient background orbs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full
          bg-brand-mint/20 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full
          bg-brand-forest/15 blur-3xl animate-float [animation-delay:2s]" />
      </div>
      <div className="w-full max-w-md px-4">{children}</div>
    </main>
  );
}
