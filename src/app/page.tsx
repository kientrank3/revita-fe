export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Welcome to Revita
        </h1>
        <p className="text-lg text-secondary mb-8">
          Your project is ready to start building amazing things!
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
            Get Started
          </button>
          <button className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
