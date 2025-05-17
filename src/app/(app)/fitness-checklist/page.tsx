"use client";

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ListChecks, PlusCircle, Trash2, Timer, Play, Pause } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Exercise {
  id: string;
  name: string;
  duration: number; // in seconds
  completed: boolean;
  timerRunning: boolean;
  timeLeft: number;
}

const DEFAULT_EXERCISES: Omit<Exercise, 'id' | 'completed' | 'timerRunning' | 'timeLeft'>[] = [
  { name: "Warm-up Stretch", duration: 300 }, // 5 minutes
  { name: "Jumping Jacks", duration: 60 },    // 1 minute
  { name: "Push-ups", duration: 60 },         // 1 minute (or reps)
  { name: "Squats", duration: 60 },           // 1 minute
  { name: "Plank", duration: 60 },            // 1 minute
  { name: "Cool-down Stretch", duration: 300 },// 5 minutes
];

export default function FitnessChecklistPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseDuration, setNewExerciseDuration] = useState(60); // Default 1 minute
  
  const intervalRefs = useRef<Record<string, NodeJS.Timeout | null>>({});

  useEffect(() => {
    const storedExercises = localStorage.getItem('fitnessExercises');
    if (storedExercises) {
      const parsedExercises = JSON.parse(storedExercises).map((ex: Exercise) => ({
        ...ex,
        timeLeft: ex.duration, // Reset timeLeft on load
        timerRunning: false,   // Ensure timers are not running on load
      }));
      setExercises(parsedExercises);
    } else {
      // Initialize with default exercises if nothing in local storage
      const initialExercises = DEFAULT_EXERCISES.map(ex => ({
        ...ex,
        id: crypto.randomUUID(),
        completed: false,
        timerRunning: false,
        timeLeft: ex.duration,
      }));
      setExercises(initialExercises);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fitnessExercises', JSON.stringify(exercises.map(ex => ({...ex, timerRunning: false})))); // Don't save timerRunning state
    // Cleanup intervals on component unmount or when exercises change causing re-renders
    return () => {
      Object.values(intervalRefs.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [exercises]);

  const toggleExerciseComplete = (id: string) => {
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, completed: !ex.completed } : ex));
  };

  const addExercise = () => {
    if (newExerciseName.trim() === "" || newExerciseDuration <= 0) return;
    const newEx: Exercise = {
      id: crypto.randomUUID(),
      name: newExerciseName.trim(),
      duration: newExerciseDuration,
      completed: false,
      timerRunning: false,
      timeLeft: newExerciseDuration,
    };
    setExercises(prev => [...prev, newEx]);
    setNewExerciseName("");
    setNewExerciseDuration(60);
  };

  const removeExercise = (id: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
    if (intervalRefs.current[id]) {
      clearInterval(intervalRefs.current[id]!);
      intervalRefs.current[id] = null;
    }
  };

  const toggleTimer = (id: string) => {
    setExercises(prevExercises => 
      prevExercises.map(ex => {
        if (ex.id === id) {
          if (ex.timerRunning) { // Pause timer
            if (intervalRefs.current[id]) {
              clearInterval(intervalRefs.current[id]!);
              intervalRefs.current[id] = null;
            }
            return { ...ex, timerRunning: false };
          } else { // Start or resume timer
            if (ex.timeLeft === 0) return ex; // Don't start if already finished
            intervalRefs.current[id] = setInterval(() => {
              setExercises(currentExs => 
                currentExs.map(currEx => {
                  if (currEx.id === id && currEx.timeLeft > 0) {
                    const newTimeLeft = currEx.timeLeft - 1;
                    if (newTimeLeft === 0) { // Timer finished
                      if (intervalRefs.current[id]) clearInterval(intervalRefs.current[id]!);
                      intervalRefs.current[id] = null;
                      return { ...currEx, timeLeft: 0, timerRunning: false, completed: true };
                    }
                    return { ...currEx, timeLeft: newTimeLeft };
                  }
                  return currEx;
                })
              );
            }, 1000);
            return { ...ex, timerRunning: true };
          }
        }
        return ex;
      })
    );
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const completedCount = exercises.filter(ex => ex.completed).length;
  const progressPercentage = exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Fitness Checklist" description="Create and manage your fitness routines. Stay on track with integrated timers." icon={ListChecks} />

      <Card>
        <CardHeader>
          <CardTitle>Your Workout Plan</CardTitle>
          <CardDescription>
            {completedCount} of {exercises.length} exercises completed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercentage} className="h-3" />
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {exercises.map(ex => (
              <Card key={ex.id} className={`p-4 flex items-center gap-4 ${ex.completed ? 'bg-muted/50' : ''}`}>
                <Checkbox 
                  id={`ex-${ex.id}`} 
                  checked={ex.completed} 
                  onCheckedChange={() => toggleExerciseComplete(ex.id)} 
                  className="h-6 w-6"
                />
                <div className="flex-1">
                  <label htmlFor={`ex-${ex.id}`} className={`font-medium ${ex.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {ex.name}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Duration: {formatTime(ex.duration)} | Time Left: {formatTime(ex.timeLeft)}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => toggleTimer(ex.id)} disabled={ex.completed || ex.timeLeft === 0 && !ex.timerRunning}>
                  {ex.timerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the exercise "{ex.name}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeExercise(ex.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Card>
            ))}
          </div>
           {exercises.length === 0 && <p className="text-center text-muted-foreground">No exercises yet. Add some below!</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Exercise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:flex sm:items-end sm:gap-4">
          <div className="flex-1 space-y-1">
            <label htmlFor="newExName" className="text-sm font-medium">Exercise Name</label>
            <Input 
              id="newExName" 
              value={newExerciseName} 
              onChange={(e) => setNewExerciseName(e.target.value)} 
              placeholder="e.g., Morning Run" 
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="newExDuration" className="text-sm font-medium">Duration (seconds)</label>
            <Input 
              id="newExDuration" 
              type="number" 
              value={newExerciseDuration} 
              onChange={(e) => setNewExerciseDuration(Math.max(1, parseInt(e.target.value, 10) || 0))} 
              placeholder="e.g., 60"
            />
          </div>
          <Button onClick={addExercise} className="w-full sm:w-auto gap-2">
            <PlusCircle className="h-5 w-5" /> Add Exercise
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
