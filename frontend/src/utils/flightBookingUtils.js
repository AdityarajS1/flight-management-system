/**
 * Parse departure time using the same formats as the backend (FlightDateTimeUtil).
 */
export function parseDepartureTime(departureTime) {
    const normalized = departureTime.trim().replace(' ', 'T');
    const withSeconds = normalized.length === 16 ? `${normalized}:00` : normalized;
    const parsed = new Date(withSeconds);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid departure time: ${departureTime}`);
    }
    return parsed;
}
export function hasFlightDeparted(departureTime) {
    try {
        return new Date() > parseDepartureTime(departureTime);
    }
    catch {
        return false;
    }
}
/** Customer may cancel only until 24 hours before scheduled departure. */
export function canCustomerCancel(departureTime) {
    try {
        const departure = parseDepartureTime(departureTime);
        const cutoff = new Date(departure.getTime() - 24 * 60 * 60 * 1000);
        return new Date() < cutoff;
    }
    catch {
        return false;
    }
}
export function formatCancelledBy(cancelledBy) {
    if (!cancelledBy)
        return '—';
    if (cancelledBy === 'CUSTOMER')
        return 'Customer';
    if (cancelledBy === 'ADMIN')
        return 'Admin';
    return cancelledBy;
}
export function getFlightDisplayStatus(flight) {
    if (hasFlightDeparted(flight.departureTime)) {
        return 'DEPARTED';
    }
    if (flight.status === 'CANCELLED') {
        return 'CANCELLED';
    }
    return 'SCHEDULED';
}
export function isFlightBookable(flight) {
    return getFlightDisplayStatus(flight) === 'SCHEDULED' && flight.seatsAvailable > 0;
}
export const FLIGHT_CANCELLED_REFUND_MSG = 'This flight has been cancelled by the airline. You will receive a full refund.';
export function getBookingStatusNote(booking) {
    var _a;
    if (booking.status === 'CONFIRMED' &&
        ((_a = booking.flight) === null || _a === void 0 ? void 0 : _a.status) === 'CANCELLED') {
        return FLIGHT_CANCELLED_REFUND_MSG;
    }
    if (booking.status === 'CANCELLED') {
        if (booking.cancelledBy === 'CUSTOMER') {
            return 'Cancelled by you — book a new flight to travel';
        }
        if (booking.cancelledBy === 'ADMIN') {
            return 'Cancelled by admin';
        }
        return 'Cancelled';
    }
    return null;
}
export function formatFlightDisplayStatus(status) {
    switch (status) {
        case 'DEPARTED':
            return 'Departed';
        case 'CANCELLED':
            return 'Cancelled';
        default:
            return 'Scheduled';
    }
}
