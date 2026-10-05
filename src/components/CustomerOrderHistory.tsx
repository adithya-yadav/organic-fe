import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { PageControls } from "@/components/PageControls";
import { api, type CustomerOrder, type PaginationMetadata } from "@/lib/api";
import { inr } from "@/data/products";

const PAGE_SIZE = 10;

type Props = {
  refreshKey: number;
};

export function CustomerOrderHistory({ refreshKey }: Props) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [refreshKey]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getMyOrders({ page, pageSize: PAGE_SIZE })
      .then((result) => {
        if (active) {
          setOrders(result.data);
          setPagination(result.pagination);
        }
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, refreshKey]);

  return (
    <section id="my-orders" className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-spice">Your account</p>
            <h2 className="mt-2 text-3xl">Your orders</h2>
          </div>
          <p className="text-sm text-muted-foreground">{pagination.total} orders</p>
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading your orders...</p>
        ) : orders.length === 0 ? (
          <p className="mt-8 border-y border-border py-8 text-sm text-muted-foreground">
            You have not placed an order yet.
          </p>
        ) : (
          <ol className="mt-6 divide-y divide-border border-y border-border">
            {orders.map((order) => (
              <li
                key={order.id}
                className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h3 className="font-medium">Order #{order.id}</h3>
                    <Badge variant="secondary">{order.status}</Badge>
                    <time className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </time>
                  </div>
                  <p className="mt-2 break-words text-sm text-muted-foreground">
                    {order.items || "Order items unavailable"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Paid by {order.payment_mode}</p>
                </div>
                <p className="font-display text-xl tabular-nums sm:text-right">
                  {inr(Number(order.total))}
                </p>
              </li>
            ))}
          </ol>
        )}
        {!loading && <PageControls pagination={pagination} onPageChange={setPage} />}
      </div>
    </section>
  );
}
