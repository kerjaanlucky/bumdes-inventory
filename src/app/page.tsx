import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Combine } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Combine className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-semibold">Bumdes App</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <section className="w-full">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-x-4">
                <Button asChild size="lg">
                  <Link href="/login">Mulai</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
