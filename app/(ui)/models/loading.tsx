export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Models</h2>
            <p className="text-muted-foreground">
              Loading your trained Stable Diffusion models...
            </p>
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
            <div className="w-12 h-12 rounded-full border-4 border-purple-600 border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-muted-foreground">Loading your models...</p>
        </div>
      </div>
    </div>
  );
}
