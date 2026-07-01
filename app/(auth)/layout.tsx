export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="animate-float absolute -top-24 -left-24 size-96 rounded-full bg-primary/45 blur-3xl dark:bg-primary/35" />
        <div
          className="animate-float absolute top-1/3 -right-24 size-96 rounded-full bg-accent/45 blur-3xl dark:bg-accent/35"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="animate-float absolute bottom-0 left-1/3 size-96 rounded-full bg-secondary/45 blur-3xl dark:bg-secondary/35"
          style={{ animationDelay: "4s" }}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
