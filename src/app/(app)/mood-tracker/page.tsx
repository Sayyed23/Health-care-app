"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { Smile as SmileIcon } from 'lucide-react'; // Renamed to avoid conflict
import { MOOD_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format, isEqual, startOfDay } from 'date-fns';

interface MoodEntry {
  date: Date;
  mood: string; // e.g., 'happy', 'sad'
  emoji: string;
  color: string;
}

export default function MoodTrackerPage() {
  const [selectedMood, setSelectedMood] = useState<(typeof MOOD_OPTIONS)[number] | null>(null);
  const [moodLog, setMoodLog] = useState<MoodEntry[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date()); // For calendar navigation

  // Load mood log from local storage on mount
  useEffect(() => {
    const storedLog = localStorage.getItem('moodLog');
    if (storedLog) {
      // Dates need to be parsed back into Date objects
      const parsedLog = JSON.parse(storedLog).map((entry: any) => ({
        ...entry,
        date: new Date(entry.date),
      }));
      setMoodLog(parsedLog);
    }
  }, []);

  // Save mood log to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('moodLog', JSON.stringify(moodLog));
  }, [moodLog]);

  const handleMoodSelect = (mood: (typeof MOOD_OPTIONS)[number]) => {
    setSelectedMood(mood);
  };

  const handleLogMood = () => {
    if (selectedMood) {
      const today = startOfDay(new Date());
      const newEntry: MoodEntry = {
        date: today,
        mood: selectedMood.label,
        emoji: selectedMood.emoji,
        color: selectedMood.color.replace('text-', '').replace('-500', ''), // Extract base color name
      };

      // Check if entry for today already exists, if so update it
      const existingEntryIndex = moodLog.findIndex(entry => isEqual(entry.date, today));
      if (existingEntryIndex > -1) {
        const updatedLog = [...moodLog];
        updatedLog[existingEntryIndex] = newEntry;
        setMoodLog(updatedLog);
      } else {
        setMoodLog([...moodLog, newEntry]);
      }
      setSelectedMood(null); // Reset selection
    }
  };

  const moodModifiers = moodLog.reduce((acc, entry) => {
    acc[entry.color] = acc[entry.color] ? [...acc[entry.color], entry.date] : [entry.date];
    return acc;
  }, {} as Record<string, Date[]>);
  
  const moodModifiersStyles = Object.keys(moodModifiers).reduce((acc, colorName) => {
    // This is a heuristic. Ideally, map color names to actual HSL values from your theme or a fixed palette.
    // For shadcn/ui default theme:
    // green: bg-green-500, yellow: bg-yellow-500, blue: bg-blue-500, orange: bg-orange-500, teal: bg-teal-500, red: bg-red-500
    // We will use tailwind classes directly for simplicity of demonstration
    // Note: This direct style injection won't respect dark mode theme variable shifts perfectly without more complex logic.
    // The `color` property in MOOD_OPTIONS should align with available Tailwind background color classes.
    acc[colorName] = { backgroundColor: `var(--tw-color-${colorName}-500, ${colorName})`, color: 'white', opacity: 0.7 };
    return acc;
  }, {} as Record<string, React.CSSProperties>);


  return (
    <div className="space-y-6">
      <PageHeader title="Mood Tracker" description="Log your daily mood and visualize your emotional patterns over time." icon={SmileIcon} />

      <Card>
        <CardHeader>
          <CardTitle>How are you feeling today?</CardTitle>
          <CardDescription>Select an emoji that best represents your current mood.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {MOOD_OPTIONS.map((mood) => (
              <Button
                key={mood.label}
                variant={selectedMood?.label === mood.label ? 'default' : 'outline'}
                onClick={() => handleMoodSelect(mood)}
                className={cn("p-3 h-auto flex flex-col items-center gap-2 w-20 sm:w-24 transition-all transform hover:scale-105", selectedMood?.label === mood.label && "ring-2 ring-primary")}
              >
                <span className={cn("text-3xl sm:text-4xl", mood.color)}>{mood.emoji}</span>
                <span className="text-xs sm:text-sm">{mood.label}</span>
              </Button>
            ))}
          </div>
          {selectedMood && (
            <div className="text-center mt-4">
              <Button onClick={handleLogMood} size="lg">
                Log {selectedMood.emoji} {selectedMood.label} for Today
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Mood Calendar</CardTitle>
          <CardDescription>
            A color-coded view of your mood entries. Current date: {format(currentDate, 'MMMM yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={new Date()} // Keep today visually selected or no selection
            onSelect={() => {}} // No action on day click for now, or could show details
            month={currentDate}
            onMonthChange={setCurrentDate}
            modifiers={moodModifiers}
            modifiersStyles={moodModifiersStyles}
            className="rounded-md border shadow-inner p-0"
            classNames={{
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
            }}
          />
        </CardContent>
         <CardContent>
          <div className="flex flex-wrap gap-2 text-xs mt-2">
            {MOOD_OPTIONS.map(mood => (
              <div key={mood.value} className="flex items-center gap-1">
                <span className={cn("w-3 h-3 rounded-full inline-block", mood.color.replace("text-","bg-"))}></span>
                <span>{mood.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
