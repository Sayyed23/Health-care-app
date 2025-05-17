import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
  // Optionally, you can return a loading indicator or a minimal page content here
  // if the redirect takes a moment or if direct null return causes issues.
  return null; 
}
