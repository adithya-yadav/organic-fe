import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, setAuthToken, type AuthUser } from "@/lib/api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated: (user: AuthUser) => void;
};

export function AuthDialog({ open, onOpenChange, onAuthenticated }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    setBusy(true);
    setError("");
    try {
      const result = mode === "register"
        ? await api.register(name, email, password)
        : await api.login(email, password);
      setAuthToken(result.data.token);
      onAuthenticated(result.data.user);
      onOpenChange(false);
      toast.success(mode === "register" ? "Your customer account is ready." : "Welcome back.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not authenticate.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "register" ? "Create your account" : "Sign in to Organic Zone"}</DialogTitle>
          <DialogDescription>
            {mode === "register" ? "Customer accounts can place and track orders." : "Use your customer or admin account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
          {mode === "register" && (
            <div>
              <Label htmlFor="account-name">Full name</Label>
              <Input id="account-name" name="name" autoComplete="name" minLength={2} maxLength={120} required className="mt-1.5" />
            </div>
          )}
          <div>
            <Label htmlFor="account-email">Email</Label>
            <Input id="account-email" name="email" type="email" autoComplete="email" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="account-password">Password</Label>
            <Input
              id="account-password"
              name="password"
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={8}
              maxLength={72}
              required
              className="mt-1.5"
            />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait..." : mode === "register" ? "Create customer account" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "register" ? "Already registered?" : "New to Organic Zone?"}{" "}
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setMode(mode === "register" ? "login" : "register");
              setError("");
            }}
          >
            {mode === "register" ? "Sign in" : "Create a customer account"}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}