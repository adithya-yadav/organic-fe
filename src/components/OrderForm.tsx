import { useMemo, useState } from "react";
import { Minus, Plus, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api, type AuthUser, type OrderInput, type Product } from "@/lib/api";
import { inr } from "@/data/products";

const orderSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().trim().email("Enter a valid email").max(160),
  address: z.string().trim().min(10, "Add house, street and landmark").max(300),
  city: z.string().trim().min(2, "Enter your city").max(80),
  state: z.string().trim().min(2, "Enter your state").max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  payment: z.enum(["UPI", "CARD", "NETBANKING", "COD"]),
  notes: z.string().trim().max(300).optional(),
});

type Errors = Partial<Record<keyof z.infer<typeof orderSchema>, string>>;

type Props = {
  cart: Record<string, number>;
  products: Product[];
  sessionId: string;
  refreshCart: () => Promise<void>;
  currentUser: AuthUser | null;
  onRequireLogin: () => void;
  onOrderPlaced: () => void;
};

export function OrderForm({ cart, products, sessionId, refreshCart, currentUser, onRequireLogin, onOrderPlaced }: Props) {
  const [errors, setErrors] = useState<Errors>({});
  const [payment, setPayment] = useState("UPI");
  const [cartBusy, setCartBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: products.find((p) => p.id === id)!, qty }))
        .filter((l) => l.product && l.qty > 0),
    [cart, products],
  );

  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const delivery = subtotal === 0 || subtotal >= 999 ? 0 : 49;
  const total = subtotal + delivery;

  const setQty = async (id: string, delta: number) => {
    if (!sessionId || cartBusy) return;
    const nextQuantity = (cart[id] ?? 0) + delta;
    setCartBusy(true);
    try {
      if (nextQuantity <= 0) {
        await api.removeFromCart(sessionId, Number(id));
      } else {
        await api.updateCartQuantity(sessionId, Number(id), nextQuantity);
      }
      await refreshCart();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your basket.");
    } finally {
      setCartBusy(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentUser?.role !== "customer") {
      onRequireLogin();
      return;
    }
    if (lines.length === 0) {
      toast.error("Your basket is empty — add a few items first.");
      return;
    }
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const parsed = orderSchema.safeParse({
      fullName: form.get("fullName"),
      phone: form.get("phone"),
      email: form.get("email"),
      address: form.get("address"),
      city: form.get("city"),
      state: form.get("state"),
      pincode: form.get("pincode"),
      payment,
      notes: form.get("notes") || undefined,
    });

    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setErrors({});
    const paymentModes: Record<typeof parsed.data.payment, OrderInput["paymentMode"]> = {
      UPI: "UPI",
      CARD: "Card",
      NETBANKING: "Net Banking",
      COD: "Cash on Delivery",
    };
    setSubmitting(true);
    try {
      const result = await api.createOrder({
        sessionId,
        fullName: parsed.data.fullName,
        mobile: parsed.data.phone,
        email: parsed.data.email,
        deliveryAddress: parsed.data.address,
        city: parsed.data.city,
        state: parsed.data.state,
        pinCode: parsed.data.pincode,
        paymentMode: paymentModes[parsed.data.payment],
        ...(parsed.data.notes ? { deliveryNotes: parsed.data.notes } : {}),
      });
      toast.success(`Order #${result.data.orderId} placed for ${inr(result.data.total)}.`);
      onOrderPlaced();
      await refreshCart();
      formElement.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place your order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="order" className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-xs uppercase tracking-[0.22em] text-spice">Checkout</p>
        <h2 className="mt-2 text-3xl md:text-4xl">Order your items</h2>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Fill in your delivery details. All amounts are in Indian Rupees (₹). Free delivery on orders
          above ₹999, otherwise a flat ₹49.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
          {currentUser?.role === "customer" ? (
          <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" name="fullName" error={errors.fullName} placeholder="Kolla Harshini" defaultValue={currentUser.name} />
              <Field label="Mobile number" name="phone" error={errors.phone} placeholder="9876543210" inputMode="numeric" />
              <div className="sm:col-span-2">
                <Field label="Email" name="email" type="email" error={errors.email} placeholder="you@example.com" defaultValue={currentUser.email} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Delivery address</Label>
                <Textarea
                  id="address"
                  name="address"
                  rows={3}
                  maxLength={300}
                  placeholder="House no, street, landmark"
                  className="mt-1.5"
                />
                {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address}</p>}
              </div>
              <Field label="City" name="city" error={errors.city} placeholder="Pune" />
              <Field label="State" name="state" error={errors.state} placeholder="Maharashtra" />
              <Field label="PIN code" name="pincode" error={errors.pincode} placeholder="411001" inputMode="numeric" />
            </div>

            <div className="mt-6">
              <Label>Payment mode</Label>
              <RadioGroup value={payment} onValueChange={setPayment} className="mt-2 grid gap-2 sm:grid-cols-4">
                {([
                  ["UPI", "UPI"],
                  ["CARD", "Card"],
                  ["NETBANKING", "Net banking"],
                  ["COD", "Cash on delivery"],
                ] as const).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  >
                    <RadioGroupItem value={value} id={`pay-${value}`} />
                    {label}
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="mt-6">
              <Label htmlFor="notes">Delivery notes (optional)</Label>
              <Input id="notes" name="notes" maxLength={300} placeholder="Leave at the gate" className="mt-1.5" />
            </div>

            <Button type="submit" size="lg" className="mt-7 w-full" disabled={submitting || !sessionId || lines.length === 0}>
              {submitting ? "Placing order..." : `Place order · ${inr(total)}`}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Truck className="size-4" /> Dispatched within 48 hours from the nearest mill
            </p>
          </form>
          ) : (
            <div className="flex min-h-56 flex-col items-start justify-center rounded-2xl border border-border bg-card p-6">
              <h3 className="text-xl">
                {currentUser?.role === "admin" ? "Customer accounts place orders" : "Sign in to place your order"}
              </h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {currentUser?.role === "admin"
                  ? "Your admin account manages products and store orders. Sign out to use a customer account at checkout."
                  : "Your basket will stay ready while you sign in or create a customer account."}
              </p>
              {!currentUser && (
                <Button type="button" className="mt-5" onClick={onRequireLogin}>
                  Sign in or register
                </Button>
              )}
            </div>
          )}

          <aside className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h3 className="text-xl">Your basket</h3>
            {lines.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No items yet — add products from this season's shelf above.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {lines.map(({ product, qty }) => (
                  <li key={product.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.unit} · {inr(product.price)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button type="button" size="icon" variant="outline" className="size-7" disabled={cartBusy} onClick={() => void setQty(product.id, -1)}>
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-6 text-center text-sm tabular-nums">{qty}</span>
                        <Button type="button" size="icon" variant="outline" className="size-7" disabled={cartBusy || qty >= product.stock} onClick={() => void setQty(product.id, 1)}>
                          <Plus className="size-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground"
                          disabled={cartBusy}
                          onClick={() => void setQty(product.id, -qty)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm tabular-nums">{inr(product.price * qty)}</p>
                  </li>
                ))}
              </ul>
            )}

            <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{inr(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="tabular-nums">{delivery === 0 ? "Free" : inr(delivery)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-display text-lg">
                <dt>Total</dt>
                <dd className="tabular-nums">{inr(total)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  error,
  type = "text",
  ...rest
}: { label: string; name: string; error?: string | undefined; type?: string | undefined } & React.ComponentProps<typeof Input>) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} className="mt-1.5" {...rest} />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
