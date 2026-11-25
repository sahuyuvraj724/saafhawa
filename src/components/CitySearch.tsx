import { useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircle,
  History,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import {
  formatPlaceDisambiguation,
  QUICK_PICK_CITIES,
  type IndianCity,
} from '../data/cities';
import {
  reverseGeocodeCoordinates,
  searchIndianPlaces,
} from '../services/openMeteo';

interface CitySearchProps {
  selectedCity: IndianCity;
  lastSearchedCity: IndianCity | null;
  onSelectCity: (city: IndianCity, source: 'search' | 'quick-pick' | 'location') => void;
}

export function CitySearch({
  selectedCity,
  lastSearchedCity,
  onSelectCity,
}: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<IndianCity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const listboxId = useId();

  useEffect(() => {
    const trimmed = query.trim();
    setSearchError(null);

    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);

    const timer = window.setTimeout(async () => {
      try {
        const found = await searchIndianPlaces(trimmed, controller.signal);
        setResults(found);
        setActiveIndex(found.length > 0 ? 0 : -1);
        setHasSearched(true);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setResults([]);
        setHasSearched(true);
        setSearchError(
          'We couldn’t reach the place search service right now. Please check your connection and try again.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleChooseFromSearch = (city: IndianCity) => {
    setLocationError(null);
    onSelectCity(city, 'search');
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setIsOpen(false);
  };

  const handleChooseQuickPick = (city: IndianCity) => {
    setLocationError(null);
    onSelectCity(city, 'quick-pick');
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      const idx = activeIndex >= 0 && activeIndex < results.length ? activeIndex : 0;
      handleChooseFromSearch(results[idx]);
    } else if (query.trim().length > 0) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length > 0) {
        setActiveIndex((prev) => (prev + 1) % results.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length > 0) {
        setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleUseMyLocation = () => {
    if (isLocating) return;
    setLocationError(null);
    setIsOpen(false);

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setLocationError(
        'Location detection isn’t supported in this browser. Search for any place in India above.'
      );
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const userPlace = await reverseGeocodeCoordinates(
            position.coords.latitude,
            position.coords.longitude
          );
          onSelectCity(userPlace, 'location');
        } finally {
          setIsLocating(false);
        }
      },
      (geoErr) => {
        setIsLocating(false);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setLocationError(
            'Location access was denied. Enable location permission in your browser, or search for any city in India.'
          );
        } else if (geoErr.code === geoErr.TIMEOUT) {
          setLocationError(
            'Finding your location took too long. Try again or type your city or town above.'
          );
        } else {
          setLocationError(
            'We couldn’t detect your location right now. Please search for your city or town above.'
          );
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const trimmedQuery = query.trim();
  const showDropdown = isOpen && trimmedQuery.length > 0;
  const showLastSearchedChip =
    lastSearchedCity !== null &&
    !QUICK_PICK_CITIES.some((q) => q.id === lastSearchedCity.id);

  return (
    <div className="space-y-3.5">
      {/* Search Box + Use My Location Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div ref={containerRef} className="relative flex-1 max-w-2xl">
          <form
            onSubmit={handleSubmit}
            role="search"
            aria-label="Search any place in India"
          >
            <label htmlFor={inputId} className="sr-only">
              Search any city, town, or district in India
            </label>
            <div className="relative flex items-center">
              <Search
                className="w-5 h-5 text-[#5A6C64] absolute left-4 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id={inputId}
                type="text"
                role="combobox"
                aria-expanded={showDropdown}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={
                  showDropdown && activeIndex >= 0 && results[activeIndex]
                    ? `${listboxId}-option-${activeIndex}`
                    : undefined
                }
                value={query}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(-1);
                  setIsOpen(true);
                }}
                placeholder="Search any place in India — e.g., Rampur, Shimla, Kochi, Jhansi..."
                className="w-full h-12 pl-12 pr-12 rounded-xl bg-white border border-[#D4DDD8] text-[#111C18] placeholder:text-[#52635C] text-sm sm:text-base shadow-xs focus:border-[#0F5E4A] transition-colors"
              />
              {isSearching ? (
                <Loader2
                  className="w-4 h-4 text-[#0F5E4A] animate-spin motion-reduce:animate-none absolute right-4 pointer-events-none"
                  aria-hidden="true"
                />
              ) : (
                query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setResults([]);
                      setHasSearched(false);
                      setSearchError(null);
                    }}
                    aria-label="Clear place search"
                    className="absolute right-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[#5A6C64] hover:text-[#111C18] hover:bg-[#EFF3F1] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )
              )}
            </div>
          </form>

          {showDropdown && (
            <div
              id={listboxId}
              role="listbox"
              aria-label="Indian place suggestions"
              className="absolute left-0 right-0 mt-2 bg-white rounded-xl border border-[#D4DDD8] shadow-lg overflow-hidden z-20"
            >
              {trimmedQuery.length < 2 ? (
                <div className="px-4 py-3.5 text-sm text-[#5A6C64]">
                  Type at least 2 letters to search any city, town, or district in India.
                </div>
              ) : isSearching ? (
                <div className="px-4 py-3.5 text-sm text-[#0F5E4A] flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                  <span>Searching places in India for “{trimmedQuery}”...</span>
                </div>
              ) : searchError ? (
                <div role="alert" className="px-4 py-3.5 text-sm text-[#991B1B]">
                  {searchError}
                </div>
              ) : results.length > 0 ? (
                <ul className="divide-y divide-[#EEF2F0] max-h-80 overflow-y-auto">
                  {results.map((place, idx) => {
                    const isActive = place.id === selectedCity.id;
                    const isHighlighted = idx === activeIndex;
                    const displayLabel = formatPlaceDisambiguation(place);
                    return (
                      <li
                        key={place.id}
                        id={`${listboxId}-option-${idx}`}
                        role="option"
                        aria-selected={isActive || isHighlighted}
                      >
                        <button
                          type="button"
                          onClick={() => handleChooseFromSearch(place)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`w-full min-h-[48px] px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#F2F6F4] transition-colors cursor-pointer ${
                            isHighlighted || isActive ? 'bg-[#ECF4F1]' : ''
                          }`}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <MapPin
                              className="w-4 h-4 text-[#0F5E4A] shrink-0"
                              aria-hidden="true"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-[#111C18] truncate">
                                {displayLabel}
                              </span>
                              {place.hindiName !== place.name && (
                                <span
                                  lang="hi"
                                  className="block text-xs text-[#4A5B54]"
                                >
                                  {place.hindiName}
                                </span>
                              )}
                            </span>
                          </span>
                          <span className="text-[11px] font-mono text-[#4A5B54] whitespace-nowrap shrink-0 tabular-nums">
                            {place.latitude.toFixed(2)}°N, {place.longitude.toFixed(2)}°E
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : hasSearched ? (
                <div
                  data-testid="no-place-found"
                  className="px-4 py-4 text-sm text-[#52605B]"
                >
                  No place in India matched <strong className="text-[#111C18]">“{trimmedQuery}”</strong>. Try checking the spelling or search a nearby district or city.
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Use My Location Button */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-2.5 rounded-xl bg-white border border-[#C9D6D0] text-[#0F3D30] text-sm font-semibold hover:bg-[#EEF5F2] hover:border-[#0F5E4A]/60 active:scale-[0.98] disabled:opacity-60 transition-all whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none shrink-0" aria-hidden="true" />
              <span>Finding your location...</span>
            </>
          ) : (
            <>
              <LocateFixed className="w-4 h-4 text-[#0F5E4A] shrink-0" aria-hidden="true" />
              <span>Use my location</span>
            </>
          )}
        </button>
      </div>

      {/* Location Loading Status */}
      {isLocating && (
        <div
          role="status"
          data-testid="locating-status"
          className="rounded-xl bg-[#F2F8F5] border border-[#CDE1D7] px-4 py-2.5 flex items-center gap-2.5 text-xs sm:text-sm text-[#0F5E4A]"
        >
          <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none shrink-0" aria-hidden="true" />
          <span>Finding your location...</span>
        </div>
      )}

      {/* Friendly Geolocation Error */}
      {locationError && (
        <div
          role="alert"
          className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 flex items-start gap-2.5 text-xs sm:text-sm text-[#991B1B]"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Quick Picks (Delhi, Jhansi, Gurugram) + Remembered Last Searched City */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Quick pick Indian cities"
      >
        <span className="text-xs font-medium text-[#5A6C64] mr-1">
          Quick picks:
        </span>
        {QUICK_PICK_CITIES.map((city) => {
          const isSelected = city.id === selectedCity.id;
          return (
            <button
              key={city.id}
              type="button"
              onClick={() => handleChooseQuickPick(city)}
              aria-pressed={isSelected}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer border ${
                isSelected
                  ? 'bg-[#0F5E4A] text-white border-[#0F5E4A] shadow-xs'
                  : 'bg-white text-[#1E2E28] border-[#D8E1DC] hover:border-[#0F5E4A]/50 hover:bg-[#F2F6F4]'
              }`}
            >
              <span>{city.name}</span>
              <span aria-hidden="true" className="mx-1.5 opacity-55">
                ·
              </span>
              <span lang="hi" className="font-normal">
                {city.hindiName}
              </span>
            </button>
          );
        })}

        {showLastSearchedChip && lastSearchedCity && (
          <button
            type="button"
            data-testid="last-searched-chip"
            onClick={() => handleChooseQuickPick(lastSearchedCity)}
            aria-pressed={lastSearchedCity.id === selectedCity.id}
            className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer border ${
              lastSearchedCity.id === selectedCity.id
                ? 'bg-[#0F5E4A] text-white border-[#0F5E4A] shadow-xs'
                : 'bg-[#F3F8F5] text-[#174636] border-[#C5DAD0] hover:border-[#0F5E4A]/60'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden="true" />
            <span>
              Last searched: {lastSearchedCity.name}
              {lastSearchedCity.state ? `, ${lastSearchedCity.state}` : ''}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
