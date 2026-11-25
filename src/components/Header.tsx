import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export function Header({ onRefresh, isLoading }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/92 backdrop-blur-md border-b border-[#E0E6E3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-8">
        <a
          href="#live-aqi"
          className="font-display text-xl font-bold tracking-tight text-[#0F3D30] whitespace-nowrap shrink-0"
        >
          SaafHawa
        </a>

        <nav
          aria-label="Primary sections"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4A5B54]"
        >
          <a
            href="#live-aqi"
            className="hover:text-[#0F3D30] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Live AQI
          </a>
          <a
            href="#best-hours"
            className="hover:text-[#0F3D30] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Best Hours
          </a>
          <a
            href="#family-plan"
            className="hover:text-[#0F3D30] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            My Family
          </a>
          <a
            href="#planners"
            className="hover:text-[#0F3D30] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Checklists
          </a>
          <a
            href="#mask-exercise"
            className="hover:text-[#0F3D30] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Mask & Exercise
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label={isLoading ? 'Refreshing live air quality' : 'Refresh live air quality'}
            className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg bg-[#0F5E4A] text-white text-sm font-medium hover:bg-[#0B4A3A] active:scale-[0.98] disabled:opacity-60 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin motion-reduce:animate-none' : ''}`}
              aria-hidden="true"
            />
            <span>Refresh Live</span>
          </button>
        </div>
      </div>
    </header>
  );
}
