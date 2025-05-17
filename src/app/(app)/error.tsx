"use client"; 

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-2xl">Oops! Something went wrong.</CardTitle>
          <CardDescription>
            We encountered an unexpected issue. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.message && (
             <p className="text-sm bg-muted p-3 rounded-md text-muted-foreground">
                Error details: {error.message}
             </p>
          )}
          <Button
            onClick={() => reset()}
            className="w-full"
          >
            Try Again
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <a href="/dashboard">Go to Dashboard</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
