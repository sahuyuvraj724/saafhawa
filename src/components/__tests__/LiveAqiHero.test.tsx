import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QUICK_PICK_CITIES } from '../../data/cities';
import type { LiveAirQualityData } from '../../utils/aqi';
import { LiveAqiHero } from '../LiveAqiHero';

function makeLiveData(usAqi: number, pm25: number, prevHourAqi = 160): LiveAirQualityData {
  return {
    city: QUICK_PICK_CITIES[0],
    fetchedAt: '2026-11-22T10:30:00Z',
    timezone: 'Asia/Kolkata',
    current: {
      time: '2026-11-22T14:00',
      usAqi,
      pm25,
      pm10: Math.round(pm25 * 1.4 * 10) / 10,
    },
    days: [
      {
        dateKey: '2026-11-22',
        label: 'Today',
        shortDate: '22 Nov',
        minAqi: Math.min(usAqi, prevHourAqi),
        maxAqi: Math.max(usAqi, prevHourAqi),
        avgAqi: usAqi,
        hourly: [
          {
            time: '2026-11-22T13:00',
            dateKey: '2026-11-22',
            hour: 13,
            usAqi: prevHourAqi,
            pm25: 55,
          },
          {
            time: '2026-11-22T14:00',
            dateKey: '2026-11-22',
            hour: 14,
            usAqi,
            pm25,
          },
        ],
      },
    ],
  };
}

describe('LiveAqiHero and AQI Gauge component', () => {
  it('renders accessible AQI gauge, category text, trend vs previous hour, cigarette card, and aria-live announcements', () => {
    const data = makeLiveData(175, 72.9, 160);
    const { rerender } = render(
      <LiveAqiHero
        city={QUICK_PICK_CITIES[0]}
        data={data}
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
        selectedDayIndex={0}
        onSelectDay={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Delhi' })).toBeInTheDocument();
    expect(screen.getByTestId('live-aqi-value')).toHaveTextContent('175');
    expect(screen.getByTestId('live-aqi-category')).toHaveTextContent('Unhealthy');

    // Gauge uses ARIA meter semantics and reduced-motion classes
    const gauge = screen.getByRole('meter', { name: /US Air Quality Index gauge/i });
    expect(gauge).toHaveAttribute('aria-valuenow', '175');
    expect(gauge).toHaveAttribute('aria-valuetext', expect.stringContaining('Unhealthy'));
    expect(screen.getByTestId('aqi-gauge-marker')).toHaveClass('motion-reduce:transition-none');
    expect(screen.getByTestId('live-pulse-dot')).toHaveClass('motion-reduce:animate-none');

    // Trend vs previous hour
    expect(screen.getByTestId('aqi-trend-badge')).toHaveTextContent('+15 vs prev hr · Worsening');

    // Cigarette equivalence card
    expect(screen.getByTestId('cigarette-equivalent-card')).toHaveTextContent(
      'Today’s air = 3.3 cigarettes'
    );

    // Live region announces AQI changes
    const announcer = screen.getByTestId('aqi-live-announcer');
    expect(announcer).toHaveAttribute('aria-live', 'polite');
    expect(announcer).toHaveTextContent(/Delhi: US AQI 175, Unhealthy/i);

    // Update to AQI 0 (Good) and verify aria-live updates
    rerender(
      <LiveAqiHero
        city={QUICK_PICK_CITIES[1]}
        data={makeLiveData(0, 0, 12)}
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
        selectedDayIndex={0}
        onSelectDay={vi.fn()}
      />
    );
    expect(screen.getByTestId('live-aqi-category')).toHaveTextContent('Good');
    expect(screen.getByTestId('aqi-live-announcer')).toHaveTextContent(/Jhansi: US AQI 0, Good/i);
  });

  it('handles AQI above 500 cleanly as Hazardous without breaking gauge bounds', () => {
    render(
      <LiveAqiHero
        city={QUICK_PICK_CITIES[0]}
        data={makeLiveData(560, 290, 520)}
        isLoading={false}
        error={null}
        onRetry={vi.fn()}
        selectedDayIndex={0}
        onSelectDay={vi.fn()}
      />
    );

    expect(screen.getByTestId('live-aqi-value')).toHaveTextContent('560');
    expect(screen.getByTestId('live-aqi-category')).toHaveTextContent('Hazardous');
    const gauge = screen.getByRole('meter', { name: /US Air Quality Index gauge/i });
    expect(gauge).toHaveAttribute('aria-valuenow', '500');
    expect(gauge).toHaveAttribute('aria-valuetext', expect.stringContaining('Hazardous'));
  });

  it('renders accessible loading state and error state with Try Again action', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    const { rerender } = render(
      <LiveAqiHero
        city={QUICK_PICK_CITIES[0]}
        data={null}
        isLoading={true}
        error={null}
        onRetry={onRetry}
        selectedDayIndex={0}
        onSelectDay={vi.fn()}
      />
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Delhi' })).toBeInTheDocument();
    expect(screen.getByText(/Fetching live AQI/i)).toBeInTheDocument();

    rerender(
      <LiveAqiHero
        city={QUICK_PICK_CITIES[0]}
        data={null}
        isLoading={false}
        error="HTTP 503"
        onRetry={onRetry}
        selectedDayIndex={0}
        onSelectDay={vi.fn()}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn’t load live air quality/i);
    await user.click(screen.getByRole('button', { name: /Try Again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
