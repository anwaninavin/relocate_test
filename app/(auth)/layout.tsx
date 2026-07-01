export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-float absolute -top-24 -left-24 size-96 rounded-full bg-primary/20 blur-3xl" />
        <div
          className="animate-float absolute top-1/3 -right-24 size-96 rounded-full bg-accent/20 blur-3xl"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="animate-float absolute bottom-0 left-1/3 size-96 rounded-full bg-secondary/20 blur-3xl"
          style={{ animationDelay: "4s" }}
        />
      </div>
      {children}
    </div>
  );
}
