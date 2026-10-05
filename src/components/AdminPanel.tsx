import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageControls } from "@/components/PageControls";
import {
  api,
  type AdminOrder,
  type OrderStatus,
  type PaginationMetadata,
  type Product,
  type ProductInput,
} from "@/lib/api";
import { inr } from "@/data/products";

const PAGE_SIZE = 10;

const orderStatuses: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Dispatched",
  "Delivered",
  "Cancelled",
];

export function AdminPanel() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  const [ordersPagination, setOrdersPagination] = useState<PaginationMetadata>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [productsPagination, setProductsPagination] = useState<PaginationMetadata>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setProductsLoading(true);
    api
      .getProducts({ page: productsPage, pageSize: PAGE_SIZE })
      .then((result) => {
        if (active) {
          setProducts(result.data);
          setProductsPagination(result.pagination);
        }
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => {
        if (active) setProductsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productsPage]);

  useEffect(() => {
    let active = true;
    setOrdersLoading(true);
    api
      .getOrders({ page: ordersPage, pageSize: PAGE_SIZE })
      .then((result) => {
        if (active) {
          setOrders(result.data);
          setOrdersPagination(result.pagination);
        }
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => {
        if (active) setOrdersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ordersPage]);

  const addProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const price = Number(form.get("price"));
    const originalPrice = Number(form.get("originalPrice"));
    const input: ProductInput = {
      category: String(form.get("category") || "").trim(),
      name: String(form.get("name") || "").trim(),
      description: String(form.get("description") || "").trim(),
      origin: String(form.get("origin") || "").trim(),
      packSize: String(form.get("packSize") || "").trim(),
      price,
      originalPrice,
      discountPercentage:
        originalPrice > 0 ? Math.max(0, Math.round((1 - price / originalPrice) * 100)) : 0,
      stock: Number(form.get("stock")),
    };

    setSavingProduct(true);
    try {
      await api.createProduct(input);
      setProductsPage(1);
      if (productsPage === 1) {
        const result = await api.getProducts({ page: 1, pageSize: PAGE_SIZE });
        setProducts(result.data);
        setProductsPagination(result.pagination);
      }
      formElement.reset();
      toast.success("Product added to the storefront.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add the product.");
    } finally {
      setSavingProduct(false);
    }
  };

  const changeOrderStatus = async (order: AdminOrder, status: OrderStatus) => {
    setUpdatingOrder(order.id);
    try {
      await api.updateOrderStatus(order.id, status);
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? { ...item, status } : item)),
      );
      toast.success(`Order #${order.id} updated.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the order.");
    } finally {
      setUpdatingOrder(null);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-spice">Store management</p>
          <h1 className="mt-2 text-3xl md:text-4xl">Admin dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {productsPagination.total} products · {ordersPagination.total} orders
        </p>
      </div>

      <Tabs defaultValue="products" className="mt-7">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="add-product">Add product</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <div className="overflow-x-auto border-y border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4 font-medium">Product</th>
                  <th className="py-3 pr-4 font-medium">Category</th>
                  <th className="py-3 pr-4 font-medium">Pack</th>
                  <th className="py-3 pr-4 font-medium">Price</th>
                  <th className="py-3 font-medium">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productsLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Loading products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No products yet.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.origin}</p>
                      </td>
                      <td className="py-3 pr-4">{product.category}</td>
                      <td className="py-3 pr-4">{product.unit}</td>
                      <td className="py-3 pr-4 tabular-nums">{inr(product.price)}</td>
                      <td className="py-3 tabular-nums">{product.stock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PageControls pagination={productsPagination} onPageChange={setProductsPage} />
        </TabsContent>

        <TabsContent value="add-product" className="mt-6">
          <form onSubmit={(event) => void addProduct(event)} className="max-w-2xl space-y-4">
            <AdminField name="name" label="Product name" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField name="category" label="Category" required />
              <AdminField name="origin" label="Farm origin" required />
            </div>
            <div>
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                name="description"
                required
                maxLength={2000}
                className="mt-1.5"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField name="packSize" label="Pack size" placeholder="500 g" required />
              <AdminField name="stock" label="Stock" type="number" min="0" required />
              <AdminField
                name="price"
                label="Selling price (₹)"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
              <AdminField
                name="originalPrice"
                label="MRP (₹)"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <Button type="submit" disabled={savingProduct}>
              {savingProduct ? "Adding product..." : "Add product"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <div className="overflow-x-auto border-y border-border">
            <table className="w-full min-w-[740px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-3 pr-4 font-medium">Order</th>
                  <th className="py-3 pr-4 font-medium">Customer</th>
                  <th className="py-3 pr-4 font-medium">Placed</th>
                  <th className="py-3 pr-4 font-medium">Total</th>
                  <th className="py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ordersLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-3 pr-4 font-medium">#{order.id}</td>
                      <td className="py-3 pr-4">
                        <p>{order.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.email || order.mobile}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 tabular-nums">{inr(Number(order.total))}</td>
                      <td className="py-3">
                        <select
                          aria-label={`Status for order ${order.id}`}
                          value={order.status}
                          disabled={updatingOrder === order.id}
                          onChange={(event) =>
                            void changeOrderStatus(order, event.target.value as OrderStatus)
                          }
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-60"
                        >
                          {orderStatuses.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PageControls pagination={ordersPagination} onPageChange={setOrdersPage} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function AdminField({
  name,
  label,
  ...inputProps
}: { name: string; label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div>
      <Label htmlFor={`product-${name}`}>{label}</Label>
      <Input id={`product-${name}`} name={name} className="mt-1.5" {...inputProps} />
    </div>
  );
}
