import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, LogIn, LogOut, ShoppingBasket, Sprout, Sun, Truck, Wheat } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderForm } from "@/components/OrderForm";
import { CustomerOrderHistory } from "@/components/CustomerOrderHistory";
import { AuthDialog } from "@/components/AuthDialog";
import {
  api,
  clearAuthToken,
  getAuthToken,
  getOrCreateSessionId,
  type AuthUser,
  type PaginationMetadata,
  type Product,
} from "@/lib/api";
import { categories, inr } from "@/data/products";
import { PageControls } from "@/components/PageControls";
import heroFarm from "@/assets/hero-farm.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Organic Zone — Indian Organic Grains, Spices & Ghee" },
      {
        name: "description",
        content:
          "Shop certified organic Indian staples in ₹ — millets, Guntur chilli, Lakadong turmeric, bilona ghee and cold-pressed oils, sourced straight from farmer families.",
      },
      { property: "og:title", content: "Organic Zone — Indian Organic Grains, Spices & Ghee" },
      {
        property: "og:description",
        content:
          "Millets, dals, spices, jaggery and bilona ghee from Indian farming families. Fair prices in rupees, delivered across India.",
      },
    ],
  }),
  component: Index,
});

const culture = [
  {
    icon: Sun,
    title: "Kharif & Rabi rhythm",
    body: "We buy by season — monsoon-sown bajra and paddy, winter-sown wheat, gram and mustard. Nothing forced out of its cycle.",
  },
  {
    icon: Sprout,
    title: "Desi seed, desi soil",
    body: "Native varieties saved by farmers themselves, grown with cow-dung compost, farm-made bio-inputs and neem — never synthetic sprays.",
  },
  {
    icon: Wheat,
    title: "Village-scale processing",
    body: "Stone mills, wooden cold-press oil mills, iron jaggery pans and hand-pounded spice blends keep flavour and livelihoods local.",
  },
];

function Index() {
  const [active, setActive] = useState<string>("All");
  const [productCategories, setProductCategories] = useState<string[]>(categories);
  const [products, setProducts] = useState<Product[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [productPagination, setProductPagination] = useState<PaginationMetadata>({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
  });
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartTotal, setCartTotal] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [productsLoading, setProductsLoading] = useState(true);
  const [pendingProduct, setPendingProduct] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
    api
      .getProductCategories()
      .then((result) => setProductCategories(result.data))
      .catch((error: Error) => toast.error(error.message));
  }, []);

  useEffect(() => {
    let activeRequest = true;
    setProductsLoading(true);
    api
      .getProducts({
        category: active === "All" ? undefined : active,
        page: productPage,
        pageSize: 12,
      })
      .then((result) => {
        if (!activeRequest) return;
        setProducts(result.data);
        setProductPagination(result.pagination);
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => {
        if (activeRequest) setProductsLoading(false);
      });

    return () => {
      activeRequest = false;
    };
  }, [active, productPage]);

  useEffect(() => {
    if (!getAuthToken()) return;
    api
      .getCurrentUser()
      .then((result) => setCurrentUser(result.data))
      .catch(() => clearAuthToken());
  }, []);

  const refreshCart = useCallback(async () => {
    if (!sessionId) return;
    const remoteCart = await api.getCart(sessionId);
    setCart(
      Object.fromEntries(remoteCart.items.map((item) => [String(item.productId), item.quantity])),
    );
    setCartTotal(remoteCart.subtotal);
  }, [sessionId]);

  useEffect(() => {
    refreshCart().catch((error: Error) => toast.error(error.message));
  }, [refreshCart]);

  const addProduct = async (productId: string) => {
    if (!sessionId) return;
    setPendingProduct(productId);
    try {
      await api.addToCart(sessionId, Number(productId));
      await refreshCart();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add this item.");
    } finally {
      setPendingProduct(null);
    }
  };

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg font-semibold">Organic Zone</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                From farm to home
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#shop">
              Shop
            </a>
            <a className="transition-colors hover:text-foreground" href="#culture">
              Our Farming
            </a>
            <a className="transition-colors hover:text-foreground" href="#farmers">
              Farmers
            </a>
            <a className="transition-colors hover:text-foreground" href="#order">
              Order
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <span className="hidden text-right sm:block">
                  <span className="block max-w-32 truncate text-sm font-medium text-foreground">
                    {currentUser.name}
                  </span>
                  <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                    {currentUser.role}
                  </span>
                </span>
                {currentUser.role === "admin" && (
                  <Button variant="outline" asChild>
                    <Link to="/admin">Dashboard</Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Sign out"
                  title="Sign out"
                  onClick={() => {
                    clearAuthToken();
                    setCurrentUser(null);
                    toast.success("Signed out.");
                  }}
                >
                  <LogOut className="size-4" />
                </Button>
              </>
            ) : (
              <Button variant="outline" className="gap-2" onClick={() => setAuthDialogOpen(true)}>
                <LogIn className="size-4" />
                <span>Sign in</span>
              </Button>
            )}
            <Button variant="outline" className="gap-2" asChild>
              <a href="#order" aria-label={`Basket: ${cartCount} items, ${inr(cartTotal)}`}>
                <ShoppingBasket className="size-4" />
                <span className="tabular-nums">{cartCount}</span>
                <span className="hidden text-muted-foreground sm:inline">·</span>
                <span className="hidden tabular-nums sm:inline">{inr(cartTotal)}</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <img
          src={heroFarm}
          alt="Indian farmer holding a cane basket of freshly harvested organic vegetables at sunrise"
          width={1600}
          height={1008}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-5 py-28 md:py-36">
          <Badge className="border-0 bg-spice text-spice-foreground">
            Certified organic · 100% Indian farms
          </Badge>
          <h1 className="mt-5 max-w-2xl text-4xl leading-[1.08] text-primary-foreground md:text-6xl">
            Grains, spices and ghee — straight from the family that grew them.
          </h1>
          <p className="mt-5 max-w-xl text-base text-primary-foreground/85 md:text-lg">
            Millets from Rajasthan, Lakadong turmeric from Meghalaya, Kolhapur jaggery and
            hand-churned ghee from Gir cows. Honest prices in rupees, no middlemen taking a cut.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <a href="#shop">Shop the harvest</a>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="bg-secondary/90 hover:bg-secondary"
              asChild
            >
              <a href="#culture">How we farm</a>
            </Button>
          </div>
          <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              ["4,200+", "farmer families"],
              ["18", "states sourced"],
              ["₹0", "middlemen margin"],
              ["48 hrs", "mill to doorstep"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-display text-2xl text-primary-foreground">{value}</dt>
                <dd className="text-xs uppercase tracking-wider text-primary-foreground/70">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="shop" className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-spice">Today's market</p>
            <h2 className="mt-2 text-3xl md:text-4xl">This season's shelf</h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            All prices in Indian Rupees, inclusive of taxes. Free delivery on orders above ₹999.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {["All", ...productCategories].map((c) => (
            <button
              key={c}
              onClick={() => {
                setActive(c);
                setProductPage(1);
              }}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                active === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {productsLoading ? (
            <li className="col-span-full py-12 text-center text-sm text-muted-foreground">
              Loading products...
            </li>
          ) : products.length === 0 ? (
            <li className="col-span-full py-12 text-center text-sm text-muted-foreground">
              No products are available right now.
            </li>
          ) : (
            products.map((p) => (
              <li
                key={p.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
              >
                <div className="block-print flex h-24 flex-col justify-between border-b border-border bg-secondary/60 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
                      {p.category}
                    </p>
                    <span className="rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-spice">
                      {Math.round(100 - (p.price / p.mrp) * 100)}% off
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Grown in India · pack of {p.unit}</p>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {p.origin}
                  </p>
                  <h3 className="mt-1.5 text-xl">{p.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.note}</p>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl tabular-nums">{inr(p.price)}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="line-through">{inr(p.mrp)}</span> · {p.unit}
                      </p>
                    </div>
                    <Button
                      disabled={pendingProduct === p.id || p.stock <= (cart[p.id] ?? 0)}
                      onClick={() => void addProduct(p.id)}
                      className="gap-2"
                    >
                      <ShoppingBasket className="size-4" />
                      {p.stock <= (cart[p.id] ?? 0)
                        ? "Sold out"
                        : cart[p.id]
                          ? `Added ${cart[p.id]}`
                          : "Add"}
                    </Button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
        <PageControls pagination={productPagination} onPageChange={setProductPage} />
      </section>

      <section id="culture" className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="text-xs uppercase tracking-[0.22em] text-spice">Farming tradition</p>
          <h2 className="mt-2 max-w-2xl text-3xl md:text-4xl">
            Farming the way our grandparents did — measured by seasons, not spreadsheets.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {culture.map(({ icon: Icon, title, body }) => (
              <article key={title} className="rounded-2xl bg-card p-6 shadow-soft">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-xl">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="farmers" className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-spice">Our farmers</p>
            <h2 className="mt-2 text-3xl md:text-4xl">Every packet carries a name</h2>
            <p className="mt-4 text-muted-foreground">
              We pay farmers 28–40% above local market rate, settle within seven days of pickup, and
              print the grower's village on every label. When you cook, you know whose field it came
              from.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Ramesh Patil · Kolhapur — sugarcane and jaggery mill",
                "Meenakshi Devi · Barmer — bajra and moth bean, rain-fed",
                "Wanshan Lyngdoh · Jaintia Hills — Lakadong turmeric",
                "Suresh Reddy · Guntur — red chilli, drip irrigated",
              ].map((f) => (
                <li key={f} className="flex gap-3">
                  <Sprout className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <h3 className="text-2xl">Monthly Kitchen Box</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              A curated crate of seasonal grains, one spice, one oil and one sweetener — enough for
              a family of four, every month.
            </p>
            <p className="mt-6 font-display text-4xl tabular-nums">
              {inr(1499)}
              <span className="text-base font-normal text-muted-foreground"> /month</span>
            </p>
            <Button size="lg" className="mt-6 w-full">
              Subscribe to the box
            </Button>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Truck className="size-4" /> Free shipping pan-India · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      <OrderForm
        cart={cart}
        products={products}
        sessionId={sessionId}
        refreshCart={refreshCart}
        currentUser={currentUser}
        onRequireLogin={() => setAuthDialogOpen(true)}
        onOrderPlaced={() => setOrdersRefreshKey((key) => key + 1)}
      />

      {currentUser?.role === "customer" && <CustomerOrderHistory refreshKey={ordersRefreshKey} />}

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onAuthenticated={setCurrentUser}
      />

      <footer className="border-t border-border bg-secondary/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p className="font-display text-base text-foreground">Organic Zone</p>
          <p>Pune, India · Made with soil, water and hard work. All prices in Indian Rupees (₹).</p>
        </div>
      </footer>
    </div>
  );
}
