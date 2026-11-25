import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QUICK_PICK_CITIES } from '../../data/cities';
import { CitySearch } from '../CitySearch';

describe('CitySearch component', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('searches Indian places via mocked geocoding API, shows City, District, State, and supports keyboard selection', async () => {
    const user = userEvent.setup();
    const onSelectCity = vi.fn();

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 101,
              name: 'Rampur',
              latitude: 28.81,
              longitude: 79.03,
              country_code: 'IN',
              admin1: 'Uttar Pradesh',
              admin2: 'Rampur',
            },
            {
              id: 102,
              name: 'Rampur',
              latitude: 31.45,
              longitude: 77.63,
              country_code: 'IN',
              admin1: 'Himachal Pradesh',
              admin2: 'Shimla',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <CitySearch
        selectedCity={QUICK_PICK_CITIES[0]}
        lastSearchedCity={null}
        onSelectCity={onSelectCity}
      />
    );

    const input = screen.getByRole('combobox', {
      name: /Search any city, town, or district in India/i,
    });
    await user.type(input, 'Rampur');

    await waitFor(() => {
      expect(screen.getByText('Rampur, Shimla, Himachal Pradesh')).toBeInTheDocument();
    });
    expect(screen.getByText('Rampur, Rampur, Uttar Pradesh')).toBeInTheDocument();

    // Keyboard ArrowDown moves highlight to second option, Enter selects it
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelectCity).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Rampur',
        district: 'Shimla',
        state: 'Himachal Pradesh',
        latitude: 31.45,
        longitude: 77.63,
      }),
      'search'
    );
  });

  it('shows a friendly message when no Indian place matches and handles API errors', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockRejectedValueOnce(new Error('Network down'));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <CitySearch
        selectedCity={QUICK_PICK_CITIES[0]}
        lastSearchedCity={null}
        onSelectCity={vi.fn()}
      />
    );

    const input = screen.getByRole('combobox', {
      name: /Search any city, town, or district in India/i,
    });
    await user.type(input, 'Zzznoplace');

    await waitFor(() => {
      expect(screen.getByTestId('no-place-found')).toHaveTextContent(
        /No place in India matched/i
      );
    });

    await user.click(screen.getByRole('button', { name: 'Clear place search' }));
    await user.type(input, 'Kochi');

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /couldn’t reach the place search service/i
      );
    });
  });

  it('renders Delhi, Jhansi, Gurugram quick picks and triggers selection', async () => {
    const user = userEvent.setup();
    const onSelectCity = vi.fn();

    render(
      <CitySearch
        selectedCity={QUICK_PICK_CITIES[0]}
        lastSearchedCity={null}
        onSelectCity={onSelectCity}
      />
    );

    await user.click(screen.getByRole('button', { name: /Jhansi/i }));
    expect(onSelectCity).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'jhansi', name: 'Jhansi' }),
      'quick-pick'
    );
  });
});
