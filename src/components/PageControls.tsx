import { Button } from "@/components/ui/button";
import type { PaginationMetadata } from "@/lib/api";

type Props = {
  pagination: PaginationMetadata;
  onPageChange: (page: number) => void;
};

export function PageControls({ pagination, onPageChange }: Props) {
  if (pagination.totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pagination.page <= 1}
        onClick={() => onPageChange(pagination.page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground" aria-live="polite">
        Page {pagination.page} of {pagination.totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pagination.page >= pagination.totalPages}
        onClick={() => onPageChange(pagination.page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
