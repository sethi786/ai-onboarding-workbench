import Link from 'next/link';
import { ShieldLogo } from '@/components/brand/ShieldLogo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-navy-deep px-6 py-12 text-white">
      <div className="bg-grid radial-fade absolute inset-0 opacity-50" />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <ShieldLogo tone="light" />
        </Link>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Clearance AI · self-evaluation & readiness aid
        </p>
      </div>
    </div>
  );
}
