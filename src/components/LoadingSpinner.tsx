export function LoadingSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-600">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
