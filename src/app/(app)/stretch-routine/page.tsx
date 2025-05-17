
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { PersonStanding, PlusCircle, Trash2, Play, Pause, RotateCcw, GripVertical, SkipForward, ChevronsUpDown } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Stretch {
  id: string;
  name: string;
  duration: number; // in seconds
}

const DEFAULT_STRETCHES: Omit<Stretch, 'id'>[] = [
  { name: "Neck Side Stretch", duration: 30 },
  { name: "Shoulder Rolls", duration: 30 },
  { name: "Triceps Stretch", duration: 20 },
  { name: "Wrist Flexion/Extension", duration: 30 },
  { name: "Torso Twist", duration: 40 },
  { name: "Cat-Cow Stretch", duration: 60 },
  { name: "Hamstring Stretch (seated)", duration: 30 },
  { name: "Quad Stretch (standing)", duration: 30 },
  { name: "Ankle Circles", duration: 30 },
];

const STRETCH_ROUTINE_STORAGE_KEY = 'stretchRoutineExercises';
const TRANSITION_DURATION = 3; // 3 seconds transition between stretches

export default function StretchRoutinePage() {
  const [stretches, setStretches] = useState<Stretch[]>([]);
  const [newStretchName, setNewStretchName] = useState("");
  const [newStretchDuration, setNewStretchDuration] = useState(30);

  const [currentStretchIndex, setCurrentStretchIndex] = useState<number | null>(null);
  const [timeLeftInStretch, setTimeLeftInStretch] = useState(0);
  const [isSequenceRunning, setIsSequenceRunning] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTimeLeft, setTransitionTimeLeft] = useState(0);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Drag and Drop state
  const draggedItemIndexRef = useRef<number | null>(null);
  const dragOverItemIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const storedStretches = localStorage.getItem(STRETCH_ROUTINE_STORAGE_KEY);
    if (storedStretches) {
      setStretches(JSON.parse(storedStretches));
    } else {
      setStretches(DEFAULT_STRETCHES.map(s => ({ ...s, id: crypto.randomUUID() })));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STRETCH_ROUTINE_STORAGE_KEY, JSON.stringify(stretches));
  }, [stretches]);

  const cleanupTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isSequenceRunning) {
      cleanupTimer();
      return;
    }

    if (currentStretchIndex === null || currentStretchIndex >= stretches.length) {
      setIsSequenceRunning(false);
      setCurrentStretchIndex(null);
      toast({ title: "Stretch Routine Complete!", description: "Great job completing your stretches." });
      return;
    }
    
    timerIntervalRef.current = setInterval(() => {
      if (isTransitioning) {
        setTransitionTimeLeft(prev => {
          if (prev <= 1) {
            setIsTransitioning(false);
            // Start next stretch
            setTimeLeftInStretch(stretches[currentStretchIndex!].duration);
            return 0;
          }
          return prev - 1;
        });
      } else {
         setTimeLeftInStretch(prev => {
          if (prev <= 1) { // Stretch ends
            // Move to transition or next stretch
            if (currentStretchIndex! < stretches.length - 1) {
              setIsTransitioning(true);
              setTransitionTimeLeft(TRANSITION_DURATION);
              setCurrentStretchIndex(idx => idx! + 1);
            } else { // Last stretch completed
              setIsSequenceRunning(false);
              setCurrentStretchIndex(null);
              toast({ title: "Stretch Routine Complete!", description: "Great job completing your stretches." });
            }
            return 0; // Return 0 to signify end for this specific stretch
          }
          return prev - 1;
        });
      }
    }, 1000);

    return cleanupTimer;
  }, [isSequenceRunning, currentStretchIndex, stretches, cleanupTimer, toast, isTransitioning]);


  const addStretch = () => {
    if (newStretchName.trim() === "" || newStretchDuration <= 0) {
      toast({ title: "Invalid Input", description: "Please enter a valid name and duration.", variant: "destructive" });
      return;
    }
    const newStretch: Stretch = {
      id: crypto.randomUUID(),
      name: newStretchName.trim(),
      duration: newStretchDuration,
    };
    setStretches(prev => [...prev, newStretch]);
    setNewStretchName("");
    setNewStretchDuration(30);
    toast({ title: "Stretch Added", description: `${newStretch.name} added to your routine.` });
  };

  const removeStretch = (id: string) => {
    setStretches(prev => prev.filter(s => s.id !== id));
    if (currentStretchIndex !== null && stretches[currentStretchIndex]?.id === id) {
      // If current stretch is removed, stop sequence
      setIsSequenceRunning(false);
      setCurrentStretchIndex(null);
      setTimeLeftInStretch(0);
      cleanupTimer();
    }
    toast({ title: "Stretch Removed", variant: "destructive" });
  };

  const handleStartSequence = () => {
    if (stretches.length === 0) {
      toast({ title: "No Stretches", description: "Add some stretches to start a routine.", variant: "destructive" });
      return;
    }
    setCurrentStretchIndex(0);
    setTimeLeftInStretch(stretches[0].duration);
    setIsTransitioning(false);
    setTransitionTimeLeft(0);
    setIsSequenceRunning(true);
  };

  const handlePauseSequence = () => {
    setIsSequenceRunning(false);
  };

  const handleResumeSequence = () => {
     if (currentStretchIndex !== null) {
       setIsSequenceRunning(true);
     } else { // If sequence was finished or not started, start it
       handleStartSequence();
     }
  };

  const handleResetSequence = () => {
    setIsSequenceRunning(false);
    setCurrentStretchIndex(null);
    setTimeLeftInStretch(0);
    setIsTransitioning(false);
    setTransitionTimeLeft(0);
    cleanupTimer();
  };
  
  const handleSkipStretch = () => {
    if (currentStretchIndex === null || !isSequenceRunning) return;
    
    cleanupTimer(); // Clear current timer
    
    if (currentStretchIndex < stretches.length - 1) {
      setIsTransitioning(true);
      setTransitionTimeLeft(TRANSITION_DURATION);
      setCurrentStretchIndex(idx => idx! + 1);
      // The useEffect will pick up the change in currentStretchIndex and start the transition timer
    } else {
      setIsSequenceRunning(false);
      setCurrentStretchIndex(null);
      toast({ title: "Stretch Routine Complete!", description: "Great job completing your stretches." });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const totalRoutineDuration = stretches.reduce((sum, s) => sum + s.duration, 0) + Math.max(0, stretches.length - 1) * TRANSITION_DURATION;

  // Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    draggedItemIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
    // Optional: You can set a class on the dragged item
    e.currentTarget.classList.add('opacity-50');
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault(); // Important to allow drop
    dragOverItemIndexRef.current = index;
    // Optional: Add a class to show drop target
    e.currentTarget.classList.add('border-primary', 'border-dashed');
  };
  
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.currentTarget.classList.remove('border-primary', 'border-dashed');
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };
  
  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary', 'border-dashed');
    
    const draggedIndex = draggedItemIndexRef.current;
    if (draggedIndex === null || draggedIndex === targetIndex) {
      draggedItemIndexRef.current = null;
      return;
    }

    setStretches(prevStretches => {
      const newStretches = [...prevStretches];
      const draggedItem = newStretches.splice(draggedIndex, 1)[0];
      newStretches.splice(targetIndex, 0, draggedItem);
      return newStretches;
    });
    draggedItemIndexRef.current = null;
  };
  
  const onDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    // Clear any target styling if not already cleared by onDragLeave or onDrop
    document.querySelectorAll('.drag-over-active').forEach(el => el.classList.remove('drag-over-active', 'border-primary', 'border-dashed'));
  };


  const currentStretch = currentStretchIndex !== null ? stretches[currentStretchIndex] : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Stretch Routine" description="Create, manage, and follow guided stretch routines." icon={PersonStanding} />

      <Card>
        <CardHeader>
          <CardTitle>Routine Controls</CardTitle>
          <CardDescription>Total Duration: {formatTime(totalRoutineDuration)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2 items-center">
          {!isSequenceRunning ? (
            <Button onClick={handleStartSequence} className="w-full sm:w-auto gap-2" disabled={stretches.length === 0}>
              <Play /> Start Routine
            </Button>
          ) : (
            <Button onClick={handlePauseSequence} className="w-full sm:w-auto gap-2">
              <Pause /> Pause Routine
            </Button>
          )}
          <Button onClick={handleResumeSequence} variant="outline" className="w-full sm:w-auto gap-2" disabled={isSequenceRunning || currentStretchIndex === null && stretches.length === 0}>
            <Play /> Resume
          </Button>
          <Button onClick={handleResetSequence} variant="outline" className="w-full sm:w-auto gap-2">
            <RotateCcw /> Reset
          </Button>
          <Button onClick={handleSkipStretch} variant="outline" className="w-full sm:w-auto gap-2" disabled={!isSequenceRunning || currentStretchIndex === null}>
            <SkipForward /> Skip Current
          </Button>
        </CardContent>
        {currentStretch && isSequenceRunning && (
          <CardContent className="pt-4 space-y-2">
            {isTransitioning ? (
               <div className="text-center p-4 bg-secondary rounded-md">
                <p className="text-lg font-semibold text-secondary-foreground">Prepare for: {stretches[currentStretchIndex!]?.name || "Next Stretch"}</p>
                <p className="text-2xl font-bold text-primary">{formatTime(transitionTimeLeft)}</p>
              </div>
            ) : (
              <div className="text-center p-4 bg-primary/10 rounded-md">
                <p className="text-lg font-semibold">Current: {currentStretch.name}</p>
                <p className="text-4xl font-bold text-primary my-2">{formatTime(timeLeftInStretch)}</p>
                <Progress value={(currentStretch.duration - timeLeftInStretch) / currentStretch.duration * 100} className="h-3" />
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Stretches</CardTitle>
            <CardDescription>Drag to reorder. Click a stretch to edit (future feature).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {stretches.length === 0 && <p className="text-muted-foreground text-center py-4">No stretches added yet.</p>}
            {stretches.map((stretch, index) => (
              <div
                key={stretch.id}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragEnter={(e) => onDragEnter(e, index)}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, index)}
                onDragEnd={onDragEnd}
                className={cn(
                  "p-3 border rounded-md flex items-center gap-3 cursor-grab group hover:bg-muted/50",
                  currentStretch?.id === stretch.id && isSequenceRunning && !isTransitioning && "ring-2 ring-primary bg-primary/5",
                  isTransitioning && currentStretchIndex === index && "ring-2 ring-secondary bg-secondary/20"
                )}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{stretch.name}</p>
                  <p className="text-sm text-muted-foreground">{formatTime(stretch.duration)}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this stretch?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove "{stretch.name}" from your routine.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeStretch(stretch.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add New Stretch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label htmlFor="newStretchName" className="text-sm font-medium mb-1 block">Stretch Name</label>
              <Input
                id="newStretchName"
                value={newStretchName}
                onChange={(e) => setNewStretchName(e.target.value)}
                placeholder="e.g., Calf Stretch"
              />
            </div>
            <div>
              <label htmlFor="newStretchDuration" className="text-sm font-medium mb-1 block">Duration (seconds)</label>
              <Input
                id="newStretchDuration"
                type="number"
                value={newStretchDuration}
                onChange={(e) => setNewStretchDuration(Math.max(5, parseInt(e.target.value, 10) || 5))}
                placeholder="e.g., 30"
              />
            </div>
            <Button onClick={addStretch} className="w-full gap-2">
              <PlusCircle className="h-5 w-5" /> Add to Routine
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
