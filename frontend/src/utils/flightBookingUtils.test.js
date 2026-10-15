import {
  formatFlightDisplayStatus,
  isFlightBookable,
} from './flightBookingUtils';

describe('flight booking utilities', () => {
  const upcomingFlight = {
    departureTime: '2999-01-01T12:00',
    status: 'SCHEDULED',
    seatsAvailable: 10,
  };

  test('allows booking an upcoming flight with available seats', () => {
    expect(isFlightBookable(upcomingFlight)).toBe(true);
  });

  test('does not allow booking when no seats are available', () => {
    expect(isFlightBookable({ ...upcomingFlight, seatsAvailable: 0 })).toBe(false);
  });

  test('formats flight statuses for display', () => {
    expect(formatFlightDisplayStatus('CANCELLED')).toBe('Cancelled');
    expect(formatFlightDisplayStatus('SCHEDULED')).toBe('Scheduled');
  });
});
