import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">404 - Page Not Found</CardTitle>
          <CardDescription className="text-base">
            Oops! The page you are looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => navigate(-1)} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/" className="inline-flex items-center justify-center">
              <Home className="mr-2 h-4 w-4 shrink-0" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}