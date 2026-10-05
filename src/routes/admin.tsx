import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";

import { AdminPanel } from "@/components/AdminPanel";
import { AuthDialog } from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { api, clearAuthToken, getAuthToken, type AuthUser } from "@/lib/api";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — Organic Zone" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }

    api.getCurrentUser()
      .then((result) => setUser(result.data))
      .catch(() => clearAuthToken())
      .finally(() => setLoading(false));
  }, []);

  const signOut = () => {
    clearAuthToken();
    setUser(null);
    toast.success("Signed out.");
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Storefront
          </Link>
          <div className="flex items-center gap-3">
            {user && <span className="hidden text-sm text-muted-foreground sm:inline">{user.name}</span>}
            {user && (
              <Button variant="outline" size="icon" aria-label="Sign out" title="Sign out" onClick={signOut}>
                <LogOut className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {loading ? (
        <p className="mx-auto max-w-7xl px-5 py-16 text-sm text-muted-foreground">Checking your account...</p>
      ) : user?.role === "admin" ? (
        <AdminPanel />
      ) : (
        <section className="mx-auto max-w-xl px-5 py-24 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-spice">Restricted area</p>
          <h1 className="mt-3 text-3xl">Admin sign-in required</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {user ? "This account is a customer account. Sign out, then sign in with your admin account." : "Sign in with your admin account to manage products and orders."}
          </p>
          {!user && (
            <Button className="mt-6" onClick={() => setAuthDialogOpen(true)}>Sign in</Button>
          )}
        </section>
      )}

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onAuthenticated={setUser}
      />
    </main>
  );
}