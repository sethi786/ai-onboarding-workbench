import Link from 'next/link';
import { ShieldLogo } from '@/components/brand/ShieldLogo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-navy-deep px-6 text-center text-white">
      <ShieldLogo tone="light" />
      <h1 className="display-md mt-4">Page not found</h1>
      <p className="text-slate-400">The page you’re looking for doesn’t exist or you don’t have access.</p>
      <Link
        href="/"
        className="mt-2 inline-flex h-10 items-center rounded-md bg-electric px-5 text-sm font-medium text-white hover:opacity-90"
      >
        Back home
      </Link>
    </div>
  );
}
