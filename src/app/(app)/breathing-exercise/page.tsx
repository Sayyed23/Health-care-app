"use client";

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Wind, Play, Pause, RotateCcw } from 'lucide-react'; // Added Play, Pause, RotateCcw
import { cn } from '@/lib/utils';

const BREATH_CYCLE_DURATION = 8000; // 4s inhale, 4s exhale (total 8 seconds)

export default function BreathingExercisePage() {
  const [sessionDuration, setSessionDuration] = useState(1); // in minutes
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationText, setAnimationText] = useState("Ready?");
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const animationRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isAnimating && animationRef.current) {
      const breath = () => {
        setAnimationText("Inhale...");
        animationRef.current?.style.setProperty('--animation-name', 'inhale');
        animationRef.current?.style.setProperty('--animation-duration', `${BREATH_CYCLE_DURATION / 2000}s`);
        
        setTimeout(() => {
          setAnimationText("Exhale...");
          animationRef.current?.style.setProperty('--animation-name', 'exhale');
        }, BREATH_CYCLE_DURATION / 2);
      };
      
      breath(); // Initial breath
      intervalRef.current = setInterval(breath, BREATH_CYCLE_DURATION);

      // Session timer
      setTimeLeft(sessionDuration * 60);
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsAnimating(false);
            setAnimationText("Session Complete!");
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if(animationRef.current) animationRef.current.style.setProperty('--animation-name', 'none');
      if (!isAnimating && timeLeft === 0 && animationText !== "Ready?") {
         // No action, session ended by timer
      } else if (!isAnimating && animationText !== "Ready?") {
        setAnimationText("Paused");
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isAnimating, sessionDuration]);


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleToggleAnimation = () => {
    if (isAnimating) {
      setIsAnimating(false);
    } else {
      setTimeLeft(sessionDuration * 60); // Reset timer before starting
      setIsAnimating(true);
    }
  };
  
  const handleReset = () => {
    setIsAnimating(false);
    setAnimationText("Ready?");
    setTimeLeft(sessionDuration * 60);
    if (animationRef.current) animationRef.current.style.setProperty('--animation-name', 'none');
  };

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @keyframes inhale {
          0% { transform: scale(0.5); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes exhale {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.5); opacity: 0.7; }
        }
        .breathing-circle {
          animation-name: var(--animation-name, none);
          animation-duration: var(--animation-duration, 4s);
          animation-timing-function: ease-in-out;
          animation-iteration-count: 1; /* Let JS handle looping via setTimeout */
          animation-fill-mode: forwards;
        }
      `}</style>
      <PageHeader title="Breathing Exercise" description="Follow the animation for a guided breathing session to calm your mind." icon={Wind} />

      <Card>
        <CardHeader>
          <CardTitle>Guided Breathing</CardTitle>
          <CardDescription>
            {isAnimating ? `Time left: ${formatTime(timeLeft)}` : `Session Duration: ${sessionDuration} minute(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-8">
          <div 
            ref={animationRef}
            className="breathing-circle w-48 h-48 sm:w-64 sm:h-64 bg-primary rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ease-in-out"
            style={{ transform: 'scale(0.5)', opacity: 0.7 } as React.CSSProperties} // Initial state
          >
            <span className="text-2xl font-semibold text-primary-foreground">{animationText}</span>
          </div>

          <div className="w-full max-w-md space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Duration:</span>
              <Slider
                disabled={isAnimating}
                defaultValue={[sessionDuration]}
                min={1}
                max={10}
                step={1}
                onValueChange={(value) => {
                  setSessionDuration(value[0]);
                  if(!isAnimating) setTimeLeft(value[0] * 60);
                }}
                className="flex-1"
              />
              <span className="text-sm font-medium w-16 text-right">{sessionDuration} min</span>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={handleToggleAnimation} size="lg" className="w-32 gap-2">
                {isAnimating ? <Pause/> : <Play/>}
                {isAnimating ? "Pause" : "Start"}
              </Button>
              <Button onClick={handleReset} size="lg" variant="outline" className="w-32 gap-2" disabled={isAnimating && timeLeft === 0}>
                <RotateCcw /> Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
