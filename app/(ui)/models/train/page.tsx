import ModelSelection from '@/components/model-selection';

export default async function TrainModelPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Train Your Custom Stable Diffusion Model
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your images, select a model, and create personalized AI art generators in minutes
            </p>
          </div>

          {/* Model Selection Section */}
          <ModelSelection />
        </div>
      </main>
    </div>
  );
} 