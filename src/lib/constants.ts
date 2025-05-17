import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Smile,
  Droplet,
  Wind,
  ListChecks,
  BookText,
  Sparkles,
  Utensils,
  Bed,
  PersonStanding,
  Scale, // Added Scale icon
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  color?: string;
  disabled?: boolean;
}

export const APP_NAME = "Zenith Wellbeing";
export const APP_LOGO_ICON = Sparkles;

export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Mood Tracker', href: '/mood-tracker', icon: Smile },
  { title: 'Meal Log', href: '/meal-log', icon: Utensils },
  { title: 'Water Intake', href: '/water-intake', icon: Droplet },
  { title: 'Sleep Tracker', href: '/sleep-tracker', icon: Bed },
  { title: 'Weight Tracker', href: '/weight-tracker', icon: Scale }, // New NavItem for Weight Tracker
  { title: 'Breathing Exercise', href: '/breathing-exercise', icon: Wind },
  { title: 'Fitness Checklist', href: '/fitness-checklist', icon: ListChecks },
  { title: 'Stretch Routine', href: '/stretch-routine', icon: PersonStanding },
  { title: 'Mood Journal', href: '/mood-journal', icon: BookText },
];

export const MOOD_OPTIONS = [
  { emoji: "😊", label: "Happy", color: "text-green-500", value: "happy" },
  { emoji: "😐", label: "Neutral", color: "text-yellow-500", value: "neutral" },
  { emoji: "😞", label: "Sad", color: "text-blue-500", value: "sad" },
  { emoji: "😟", label: "Anxious", color: "text-orange-500", value: "anxious" },
  { emoji: "😌", label: "Calm", color: "text-teal-500", value: "calm" },
  { emoji: "😡", label: "Angry", color: "text-red-500", value: "angry" },
];

export const JOURNAL_TAG_SUGGESTIONS = [
  "grateful", "stressed", "productive", "relaxed", "inspired", "tired", "hopeful", "anxious"
];
