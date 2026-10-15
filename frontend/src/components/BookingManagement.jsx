import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getStoredToken } from '../utils/auth';
import { formatCancelledBy, hasFlightDeparted } from '../utils/flightBookingUtils';
const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [revenueUpdate, setRevenueUpdate] = useState(null);
    useEffect(() => {
        fetchBookings();
    }, []);
    const fetchBookings = async () => {
        try {
            setLoading(true);
            const token = getStoredToken();
            const response = await axios.get('http://localhost:8085/api/admin/booking-management', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success) {
                setBookings(response.data.bookings);
            }
            else {
                setError('Failed to fetch bookings');
            }
        }
        catch (err) {
            setError('Error fetching bookings');
        }
        finally {
            setLoading(false);
        }
    };
    const cancelBooking = async (bookingId, departureTime) => {
        try {
            if (hasFlightDeparted(departureTime)) {
                setError('Cannot modify booking. Flight has already departed.');
                setTimeout(() => setError(null), 3000);
                return;
            }
            const booking = bookings.find(b => b.id === bookingId);
            if (!booking) {
                setError('Booking not found');
                setTimeout(() => setError(null), 3000);
                return;
            }
            const token = getStoredToken();
            const response = await axios.post(`http://localhost:8085/api/admin/booking-management/${bookingId}/cancel`, {}, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success) {
                setSuccessMessage(response.data.message);
                fetchBookings();
                if (response.data.stats) {
                    const revenue = response.data.stats.totalRevenue;
                    setRevenueUpdate(`₹${booking.totalAmount} removed from revenue. Total revenue: ₹${revenue}`);
                    setTimeout(() => setRevenueUpdate(null), 5000);
                }
                setTimeout(() => setSuccessMessage(null), 3000);
            }
            else {
                setError(response.data.message || 'Failed to cancel booking');
                setTimeout(() => setError(null), 3000);
            }
        }
        catch (err) {
            setError('Error updating booking status');
            setTimeout(() => setError(null), 3000);
        }
    };
    const getStatusBadge = (status) => {
        const colors = {
            CONFIRMED: '#28a745',
            CANCELLED: '#dc3545',
            PENDING: '#ffc107',
            COMPLETED: '#17a2b8'
        };
        return (<span style={{
                backgroundColor: colors[status] || '#6c757d',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
            }}>
        {status}
      </span>);
    };
    const getFlightStatusBadge = (booking) => {
        const departed = hasFlightDeparted(booking.flight.departureTime);
        if (departed) {
            return (<span style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}>
          Departed
        </span>);
        }
        if (booking.flight.status === 'CANCELLED') {
            return (<span style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}>
          Flight Cancelled
        </span>);
        }
        return (<span style={{
                backgroundColor: '#28a745',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
            }}>
        Active
      </span>);
    };
    const formatDateTime = (dateTimeString) => {
        return new Date(dateTimeString).toLocaleString();
    };
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(price);
    };
    if (loading) {
        return (<div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading bookings...</div>
      </div>);
    }
    return (<div style={{ padding: '20px' }}>
      <h2>Booking Management</h2>

      {successMessage && (<div style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '20px'
            }}>
          {successMessage}
        </div>)}

      {revenueUpdate && (<div style={{
                backgroundColor: '#cce5ff',
                color: '#004085',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '20px',
                border: '1px solid #b8daff'
            }}>
          💰 {revenueUpdate}
        </div>)}

      {error && (<div style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '20px'
            }}>
          {error}
        </div>)}

      <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'auto'
        }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '960px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Booking ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Flight</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Passenger</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Booking Status</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Cancelled By</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Flight Status</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Booking Date</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
            const isExpired = hasFlightDeparted(booking.flight.departureTime);
            return (<tr key={booking.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>#{booking.id}</td>
                  <td style={{ padding: '12px' }}>
                    <div>
                      <strong>{booking.flight.flightNumber}</strong>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        {booking.flight.source} → {booking.flight.destination}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6c757d' }}>
                        {formatDateTime(booking.flight.departureTime)}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div>
                      <strong>{booking.passenger.name}</strong>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        {booking.passenger.email}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {getStatusBadge(booking.status)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {booking.status === 'CANCELLED' ? (<span style={{ fontSize: '13px', fontWeight: 600 }}>
                        {formatCancelledBy(booking.cancelledBy)}
                      </span>) : (<span style={{ color: '#6c757d' }}>—</span>)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {getFlightStatusBadge(booking)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {formatPrice(booking.totalAmount)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      {formatDateTime(booking.bookingDate)}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {booking.status === 'CONFIRMED' ? (<button onClick={() => cancelBooking(booking.id, booking.flight.departureTime)} disabled={isExpired} style={{
                        backgroundColor: isExpired ? '#6c757d' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: isExpired ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        opacity: isExpired ? 0.6 : 1
                    }} title={isExpired ? 'Flight has already departed' : 'Cancel booking'}>
                        Cancel
                      </button>) : booking.status === 'CANCELLED' ? (<span style={{ color: '#6c757d', fontSize: '13px', fontStyle: 'italic' }}>
                        Must book again
                      </span>) : (<span style={{ color: '#6c757d', fontSize: '14px' }}>
                        {booking.status}
                      </span>)}
                  </td>
                </tr>);
        })}
          </tbody>
        </table>

        {bookings.length === 0 && (<div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            No bookings found
          </div>)}
      </div>
    </div>);
};
export default BookingManagement;
