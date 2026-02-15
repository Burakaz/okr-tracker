export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-foreground rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">OKR</span>
        </div>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground" />
      </div>
    </div>
  );
}
