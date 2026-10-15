import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingService } from '../services/api';
import { canCustomerCancel, getBookingStatusNote, FLIGHT_CANCELLED_REFUND_MSG, } from '../utils/flightBookingUtils';
import './UserProfile.css';
const UserProfile = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [cancellingId, setCancellingId] = useState(null);
    const [user, setUser] = useState(null);
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchBookings();
    }, []);
    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            if (!token || !userData) {
                setError('Please login to view your bookings');
                return;
            }
            const parsedUser = JSON.parse(userData);
            const data = await bookingService.getUserBookings(parsedUser.id);
            setBookings(data);
        }
        catch (err) {
            setError('Network error. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleCancelBooking = async (bookingId) => {
        var _a, _b;
        if (!(user === null || user === void 0 ? void 0 : user.id))
            return;
        const confirmed = window.confirm('Cancel this ticket? You will need to book a new flight to travel on this route.');
        if (!confirmed)
            return;
        try {
            setCancellingId(bookingId);
            setError('');
            const result = await bookingService.cancelBooking(bookingId, user.id);
            if (result.success) {
                setSuccess(result.message || 'Booking cancelled successfully');
                await fetchBookings();
                setTimeout(() => setSuccess(''), 4000);
            }
            else {
                setError(result.message || 'Failed to cancel booking');
            }
        }
        catch (err) {
            const message = err && typeof err === 'object' && 'response' in err
                ? (_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message
                : 'Failed to cancel booking';
            setError(message || 'Failed to cancel booking');
        }
        finally {
            setCancellingId(null);
        }
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const getStatusColor = (status) => {
        switch (status.toUpperCase()) {
            case 'CONFIRMED':
                return '#28a745';
            case 'PENDING':
                return '#ffc107';
            case 'CANCELLED':
                return '#dc3545';
            default:
                return '#6c757d';
        }
    };
    if (loading) {
        return (<div className="user-profile-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your booking history...</p>
        </div>
      </div>);
    }
    return (<div className="user-profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <h1 className="app-title">Fly High</h1>
          <h2>User Profile</h2>
          {user && (<div className="user-details">
              <p><strong>Name:</strong> {user.name || 'N/A'}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Account Type:</strong> {user.role === 'USER' ? 'Regular User' : 'Admin'}</p>
            </div>)}
        </div>
        <div className="profile-actions">
          <Link to="/dashboard" className="back-to-booking">
            Back to Dashboard
          </Link>
          <button onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }} className="logout-button">
            Logout
          </button>
        </div>
      </div>

      <div className="booking-history-section">
        <h3>Booking History</h3>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message" style={{ color: '#155724', marginBottom: '12px' }}>{success}</div>}

        {bookings.length === 0 ? (<div className="no-bookings">
            <div className="no-bookings-icon"> flights</div>
            <h4>No Bookings Found</h4>
            <p>You haven't booked any flights yet. Start your journey with Fly High!</p>
            <Link to="/dashboard" className="book-now-button">Book Your First Flight</Link>
          </div>) : (<div className="bookings-grid">
            {bookings.map((booking) => {
                var _a;
                const statusNote = getBookingStatusNote(booking);
                const isRefundNotice = statusNote === FLIGHT_CANCELLED_REFUND_MSG;
                const eligibleToCancel = booking.status === 'CONFIRMED' &&
                    ((_a = booking.flight) === null || _a === void 0 ? void 0 : _a.status) !== 'CANCELLED' &&
                    canCustomerCancel(booking.flight.departureTime);
                const withinWindowButNotEligible = booking.status === 'CONFIRMED' &&
                    !canCustomerCancel(booking.flight.departureTime);
                return (<div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <div className="flight-number">{booking.flight.flightNumber}</div>
                    <div className="booking-status" style={{ color: getStatusColor(booking.status) }}>
                      {booking.status}
                    </div>
                  </div>

                  {statusNote && (<p style={{
                            color: isRefundNotice ? '#856404' : '#6c757d',
                            fontSize: '13px',
                            fontStyle: 'italic',
                            margin: '0 0 8px',
                            backgroundColor: isRefundNotice ? '#fff3cd' : 'transparent',
                            padding: isRefundNotice ? '8px 10px' : 0,
                            borderRadius: isRefundNotice ? '6px' : 0,
                            border: isRefundNotice ? '1px solid #ffeeba' : 'none',
                        }}>
                      {isRefundNotice && '💰 '}{statusNote}
                    </p>)}

                  <div className="flight-route">
                    <div className="route-point">
                      <div className="airport-code">{booking.flight.source}</div>
                      <div className="airport-name">Departure</div>
                      <div className="flight-time">
                        {formatDate(booking.flight.departureTime)}
                      </div>
                    </div>

                    <div className="route-arrow">flight</div>

                    <div className="route-point">
                      <div className="airport-code">{booking.flight.destination}</div>
                      <div className="airport-name">Arrival</div>
                      <div className="flight-time">
                        {formatDate(booking.flight.arrivalTime)}
                      </div>
                    </div>
                  </div>

                  <div className="booking-details">
                    <div className="passenger-info">
                      <p><strong>Passenger:</strong> {booking.passenger.name}</p>
                      <p><strong>Contact:</strong> {booking.passenger.phone}</p>
                    </div>

                    <div className="booking-info">
                      <p><strong>Booking ID:</strong> #{booking.id}</p>
                      <p><strong>Booked on:</strong> {formatDate(booking.bookingDate)}</p>
                    </div>
                  </div>

                  <div className="payment-section">
                    <div className="amount-info">
                      <span className="amount-label">Total Amount:</span>
                      <span className="amount-value">₹{booking.totalAmount.toLocaleString()}</span>
                    </div>

                    {booking.payment && (<div className="payment-info">
                        <p><strong>Payment ID:</strong> {booking.payment.paymentId}</p>
                        <p><strong>Payment Status:</strong> {booking.payment.status}</p>
                        <p><strong>Payment Date:</strong> {formatDate(booking.payment.paymentDate)}</p>
                      </div>)}
                  </div>

                  {eligibleToCancel && (<button type="button" className="cancel-ticket-btn" disabled={cancellingId === booking.id} onClick={() => handleCancelBooking(booking.id)} style={{
                            marginTop: '12px',
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: cancellingId === booking.id ? 'wait' : 'pointer',
                            fontWeight: 600,
                        }}>
                      {cancellingId === booking.id ? 'Cancelling…' : 'Cancel Ticket'}
                    </button>)}

                  {withinWindowButNotEligible && (<p style={{
                            marginTop: '12px',
                            fontSize: '13px',
                            color: '#6c757d',
                            fontStyle: 'italic',
                        }} title="Cancellation closes 24 hours before departure">
                      Cancellation unavailable (within 24 hours of departure)
                    </p>)}

                  {booking.status === 'CANCELLED' && (<Link to="/dashboard" className="book-now-button" style={{ display: 'inline-block', marginTop: '12px', textAlign: 'center' }}>
                      Book a New Flight
                    </Link>)}
                </div>);
            })}
          </div>)}
      </div>
    </div>);
};
export default UserProfile;
