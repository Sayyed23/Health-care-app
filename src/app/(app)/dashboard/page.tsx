import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Activity, Droplet, Smile, BookText, ListChecks, Wind, Utensils, Bed, PersonStanding } from "lucide-react"; // Added PersonStanding

export default function DashboardPage() {
  const quickAccessItems = [
    { title: "Log Mood", href: "/mood-tracker", icon: Smile, description: "Record how you're feeling today." },
    { title: "Log Meal", href: "/meal-log", icon: Utensils, description: "Track your daily calorie intake." },
    { title: "Add Water", href: "/water-intake", icon: Droplet, description: "Track your daily hydration." },
    { title: "Track Sleep", href: "/sleep-tracker", icon: Bed, description: "Log your sleep hours." },
    { title: "Start Breathing", href: "/breathing-exercise", icon: Wind, description: "Relax with a guided session." },
    { title: "Plan Fitness", href: "/fitness-checklist", icon: ListChecks, description: "Check off your workout." },
    { title: "Stretch Routine", href: "/stretch-routine", icon: PersonStanding, description: "Follow a guided stretch sequence." },
    { title: "Write Journal", href: "/mood-journal", icon: BookText, description: "Reflect on your day." },
  ];

  // Ordered list for dashboard display
   const orderedQuickAccessItems = [
    quickAccessItems.find(item => item.title === "Log Mood"),
    quickAccessItems.find(item => item.title === "Log Meal"),
    quickAccessItems.find(item => item.title === "Add Water"),
    quickAccessItems.find(item => item.title === "Track Sleep"),
    quickAccessItems.find(item => item.title === "Start Breathing"),
    quickAccessItems.find(item => item.title === "Plan Fitness"),
    quickAccessItems.find(item => item.title === "Stretch Routine"),
    quickAccessItems.find(item => item.title === "Write Journal"),
  ].filter(Boolean) as typeof quickAccessItems;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Welcome to Zenith Wellbeing!</CardTitle>
          <CardDescription className="text-lg">Your daily companion for a healthier, happier life. What would you like to do today?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orderedQuickAccessItems.map((item) => (
              <Link href={item.href} key={item.title} passHref>
                <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-medium">{item.title}</CardTitle>
                    <item.icon className="h-6 w-6 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Your Week at a Glance</CardTitle>
            <CardDescription>Summary of your recent activity and progress.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center">
             <Image src="https://placehold.co/600x300.png" alt="Weekly summary placeholder" width={600} height={300} className="rounded-md" data-ai-hint="abstract graph" />
            <p className="text-sm text-muted-foreground mt-4">Mood trends, hydration levels, and more will appear here as you log your activities.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/mood-journal">View Mood Chart</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Stay Motivated</CardTitle>
            <CardDescription>Discover tips and articles for a healthier lifestyle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
              <Activity className="h-8 w-8 text-primary mt-1 shrink-0" />
              <div>
                <h4 className="font-semibold">The Importance of Mindfulness</h4>
                <p className="text-sm text-muted-foreground">Learn how daily mindfulness can reduce stress.</p>
              </div>
            </div>
             <div className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
              <Droplet className="h-8 w-8 text-primary mt-1 shrink-0" />
              <div>
                <h4 className="font-semibold">Hydration Facts</h4>
                <p className="text-sm text-muted-foreground">Why water is crucial for your body and mind.</p>
              </div>
            </div>
             <div className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
              <Smile className="h-8 w-8 text-primary mt-1 shrink-0" />
              <div>
                <h4 className="font-semibold">Understanding Your Moods</h4>
                <p className="text-sm text-muted-foreground">Tips for navigating emotional highs and lows.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
