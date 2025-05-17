"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Droplet, Minus, Plus, RefreshCw } from 'lucide-react'; // Added Minus, Plus, RefreshCw
import { cn } from '@/lib/utils';

const DAILY_GOAL_ML = 2000; // Default daily goal in ml
const CUP_SIZES = [
  { size: 250, label: "Small Cup (250ml)" },
  { size: 500, label: "Medium Bottle (500ml)" },
  { size: 750, label: "Large Bottle (750ml)" },
];

export default function WaterIntakePage() {
  const [currentIntake, setCurrentIntake] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(DAILY_GOAL_ML);

  // Load state from local storage
  useEffect(() => {
    const storedIntake = localStorage.getItem('waterIntake');
    const storedGoal = localStorage.getItem('waterGoal');
    if (storedIntake) {
      setCurrentIntake(JSON.parse(storedIntake));
    }
    if (storedGoal) {
      setDailyGoal(JSON.parse(storedGoal));
    }
  }, []);

  // Save state to local storage
  useEffect(() => {
    localStorage.setItem('waterIntake', JSON.stringify(currentIntake));
  }, [currentIntake]);

  useEffect(() => {
    localStorage.setItem('waterGoal', JSON.stringify(dailyGoal));
  }, [dailyGoal]);


  const handleAddWater = (amount: number) => {
    setCurrentIntake((prev) => Math.min(prev + amount, dailyGoal * 2)); // Cap at 2x goal to prevent overflow
  };

  const handleResetIntake = () => {
    setCurrentIntake(0);
  };

  const progressPercentage = Math.min((currentIntake / dailyGoal) * 100, 100);
  const isGoalReached = currentIntake >= dailyGoal;

  return (
    <div className="space-y-6">
      <PageHeader title="Water Intake Tracker" description="Stay hydrated by tracking your daily water consumption." icon={Droplet} />

      <Card>
        <CardHeader>
          <CardTitle>Daily Hydration Goal</CardTitle>
          <CardDescription>
            Your current goal is {dailyGoal}ml. You've had {currentIntake}ml so far.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Progress value={progressPercentage} className="h-8 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("font-semibold", progressPercentage > 40 ? "text-primary-foreground" : "text-foreground")}>
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
          {isGoalReached && (
            <p className="text-center text-green-600 font-semibold">
              🎉 Goal Reached! Keep it up! 🎉
            </p>
          )}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setDailyGoal(g => Math.max(500, g - 250))}><Minus className="h-4 w-4"/></Button>
            <span className="text-sm w-32 text-center">Goal: {dailyGoal}ml</span>
            <Button variant="outline" size="icon" onClick={() => setDailyGoal(g => g + 250)}><Plus className="h-4 w-4"/></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Your Water</CardTitle>
          <CardDescription>Tap a button to add water to your daily total.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CUP_SIZES.map((cup) => (
            <Button
              key={cup.size}
              variant="outline"
              className="p-6 h-auto flex flex-col items-center gap-2 text-lg hover:bg-primary/10 hover:border-primary"
              onClick={() => handleAddWater(cup.size)}
            >
              <Droplet className="h-10 w-10 text-primary mb-2" />
              <span>{cup.label}</span>
            </Button>
          ))}
        </CardContent>
         <CardContent className="mt-4 flex justify-center">
            <Button variant="destructive" onClick={handleResetIntake} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Reset Daily Intake
            </Button>
          </CardContent>
      </Card>
    </div>
  );
}
