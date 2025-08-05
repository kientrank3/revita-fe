import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Welcome to Revita
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Your project is ready to start building!
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">Get Started</Button>
            <Button variant="outline" size="lg">Learn More</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shadcn/ui Components Ready</CardTitle>
            <CardDescription>
              All essential UI components are installed and configured with your custom colors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-muted-foreground">#35b8cf</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Secondary</p>
                <p className="text-xs text-muted-foreground">#11325b</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-accent rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Accent</p>
                <p className="text-xs text-muted-foreground">Accent</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-2"></div>
                <p className="text-sm font-medium">Muted</p>
                <p className="text-xs text-muted-foreground">Muted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
