import { ShieldAlert } from "lucide-react";

export function BannedNotice({ reason }: { reason?: string | null }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <ShieldAlert className="h-12 w-12 text-destructive" aria-hidden />
      <h1 className="text-2xl font-bold">Account suspended</h1>
      <p className="max-w-md text-muted-foreground">
        {reason
          ? `Reason: ${reason}`
          : "Your account has been suspended. Contact support if you believe this is a mistake."}
      </p>
    </div>
  );
}
