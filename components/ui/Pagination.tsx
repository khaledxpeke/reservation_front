import { Button } from "./Button";

export function Pagination({
  page,
  totalPages,
  loading,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center gap-3">
      <Button variant="secondary" disabled={page <= 1 || loading} onClick={onPrev}>
        Précédent
      </Button>
      <span className="text-sm text-zinc-600">
        Page {page} / {totalPages}
      </span>
      <Button variant="secondary" disabled={page >= totalPages || loading} onClick={onNext}>
        Suivant
      </Button>
    </div>
  );
}
