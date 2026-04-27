import { cn } from '@/lib/utils';
import { Car } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Car className="h-8 w-8 text-primary" />
      <h1 className="font-headline text-xl font-bold">AutoHub</h1>
    </div>
  );
}
