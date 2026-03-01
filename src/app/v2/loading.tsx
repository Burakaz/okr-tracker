export default function V2Loading() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-5 h-5 border-2 border-[var(--v2-text-3)] border-t-[var(--v2-accent)] rounded-full animate-spin" />
      </div>
    </div>
  );
}
