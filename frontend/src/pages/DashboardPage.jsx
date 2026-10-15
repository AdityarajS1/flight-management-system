import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { flightService, paymentService, bookingService } from '../services/api';
import { canCustomerCancel, getBookingStatusNote, getFlightDisplayStatus, isFlightBookable, formatFlightDisplayStatus, } from '../utils/flightBookingUtils';
import { getStoredUser } from '../utils/auth';
import './DashboardPage.css';
const DashboardPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        totalBookings: 0,
        upcomingTrips: 0,
        totalSpent: 0,
        availableFlights: 0
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [allFlights, setAllFlights] = useState([]);
    const [filteredFlights, setFilteredFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchFilters, setSearchFilters] = useState({
        source: '',
        destination: '',
        date: '',
        time: '',
    });
    const [bookingStatusChange, setBookingStatusChange] = useState(null);
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchDashboardData();
    }, []);
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // Fetch available flights
            const flights = await flightService.getAllFlights();
            setAllFlights(flights);
            setFilteredFlights(flights); // Show all flights initially
            const storedUser = getStoredUser();
            if (storedUser === null || storedUser === void 0 ? void 0 : storedUser.id) {
                try {
                    const token = localStorage.getItem('token');
                    const bookingsResponse = await fetch(`/api/bookings/user/${storedUser.id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    let totalBookings = 0;
                    let upcomingTrips = 0;
                    let bookings = [];
                    if (bookingsResponse.ok) {
                        bookings = await bookingsResponse.json();
                        setRecentBookings(bookings.slice(0, 3));
                        totalBookings = bookings.length;
                        upcomingTrips = bookings.filter((b) => new Date(b.flight.departureTime) > new Date() && b.status === 'CONFIRMED').length;
                    }
                    let totalSpent = 0;
                    try {
                        totalSpent = await paymentService.getTotalSpent(storedUser.id);
                    }
                    catch (paymentError) {
                        totalSpent = bookings.reduce((sum, b) => b.status === 'CONFIRMED' ? sum + (b.totalAmount || 0) : sum, 0);
                        console.error('Failed to fetch total spent from payments:', paymentError);
                    }
                    setStats({
                        totalBookings,
                        upcomingTrips,
                        totalSpent,
                        availableFlights: flights.length,
                    });
                }
                catch (error) {
                    console.error('Failed to fetch bookings:', error);
                }
            }
            // Set available flights count
            setStats(prev => ({ ...prev, availableFlights: flights.length }));
        }
        catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const refreshBookings = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            if (token && userData) {
                const user = JSON.parse(userData);
                const bookingsResponse = await fetch(`/api/bookings/user/${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (bookingsResponse.ok) {
                    const bookings = await bookingsResponse.json();
                    const previousBookings = recentBookings;
                    setRecentBookings(bookings.slice(0, 3));
                    // Check for status changes
                    const statusChanges = bookings.filter((newBooking) => {
                        const oldBooking = previousBookings.find((old) => old.id === newBooking.id);
                        return oldBooking && oldBooking.status !== newBooking.status;
                    });
                    if (statusChanges.length > 0) {
                        statusChanges.forEach((booking) => {
                            var _a, _b;
                            const oldBooking = previousBookings.find((old) => old.id === booking.id);
                            if (oldBooking) {
                                if (oldBooking.status === 'CONFIRMED' && booking.status === 'CANCELLED') {
                                    const by = booking.cancelledBy === 'CUSTOMER' ? 'you' : 'admin';
                                    setBookingStatusChange(`Booking #${booking.id} has been cancelled by ${by}`);
                                }
                                else if (oldBooking.status === 'CONFIRMED' &&
                                    booking.status === 'CONFIRMED' &&
                                    ((_a = oldBooking.flight) === null || _a === void 0 ? void 0 : _a.status) !== 'CANCELLED' &&
                                    ((_b = booking.flight) === null || _b === void 0 ? void 0 : _b.status) === 'CANCELLED') {
                                    setBookingStatusChange(`Booking #${booking.id}: flight cancelled by airline — you will receive a full refund`);
                                }
                            }
                        });
                        // Clear status change message after 5 seconds
                        setTimeout(() => setBookingStatusChange(null), 5000);
                    }
                    // Update stats
                    const totalBookings = bookings.length;
                    const upcomingTrips = bookings.filter((b) => new Date(b.flight.departureTime) > new Date() && b.status === 'CONFIRMED').length;
                    let totalSpent = 0;
                    try {
                        totalSpent = await paymentService.getTotalSpent(user.id);
                    }
                    catch {
                        totalSpent = bookings.reduce((sum, b) => b.status === 'CONFIRMED' ? sum + (b.totalAmount || 0) : sum, 0);
                    }
                    setStats(prev => ({
                        ...prev,
                        totalBookings,
                        upcomingTrips,
                        totalSpent,
                    }));
                }
            }
        }
        catch (error) {
            console.error('Failed to refresh bookings:', error);
        }
    }, [recentBookings]);
    // Auto-refresh bookings every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refreshBookings();
        }, 30000);
        return () => clearInterval(interval);
    }, [refreshBookings]);
    const handleBookFlight = (flightId) => {
        navigate(`/booking/${flightId}`);
    };
    const handleViewAllFlights = () => {
        navigate('/flights');
    };
    const handleViewProfile = () => {
        navigate('/profile');
    };
    const handleCancelBooking = async (bookingId) => {
        const storedUser = getStoredUser();
        if (!(storedUser === null || storedUser === void 0 ? void 0 : storedUser.id))
            return;
        if (!window.confirm('Cancel this ticket? You must book again to travel on this route.')) {
            return;
        }
        try {
            const result = await bookingService.cancelBooking(bookingId, storedUser.id);
            if (result.success) {
                await fetchDashboardData();
            }
            else {
                alert(result.message || 'Failed to cancel booking');
            }
        }
        catch {
            alert('Failed to cancel booking');
        }
    };
    const handleSearch = async () => {
        if (searchFilters.source.trim() && searchFilters.destination.trim()) {
            try {
                const results = await flightService.searchFlights(searchFilters.source.trim(), searchFilters.destination.trim(), searchFilters.date || undefined, searchFilters.time || undefined);
                setFilteredFlights(results);
                return;
            }
            catch (err) {
                console.error('Search failed, using local filter:', err);
            }
        }
        let filtered = allFlights;
        if (searchFilters.source) {
            filtered = filtered.filter((flight) => flight.source.toLowerCase().includes(searchFilters.source.toLowerCase()));
        }
        if (searchFilters.destination) {
            filtered = filtered.filter((flight) => flight.destination.toLowerCase().includes(searchFilters.destination.toLowerCase()));
        }
        if (searchFilters.date) {
            filtered = filtered.filter((flight) => {
                const flightDate = new Date(flight.departureTime).toDateString();
                const searchDate = new Date(searchFilters.date).toDateString();
                return flightDate === searchDate;
            });
        }
        if (searchFilters.time) {
            filtered = filtered.filter((flight) => {
                const dep = new Date(flight.departureTime);
                const [hours, minutes] = searchFilters.time.split(':').map(Number);
                const filterMinutes = hours * 60 + minutes;
                const flightMinutes = dep.getHours() * 60 + dep.getMinutes();
                return flightMinutes >= filterMinutes;
            });
        }
        setFilteredFlights(filtered);
    };
    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const formatDateTime = (dateTimeStr) => {
        return new Date(dateTimeStr).toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    if (loading) {
        return (<div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>);
    }
    return (<div className="dashboard-home">
      <div className="container">
        {/* Status Change Notification */}
        {bookingStatusChange && (<div style={{
                backgroundColor: bookingStatusChange.includes('cancelled') ? '#f8d7da' : '#d4edda',
                color: bookingStatusChange.includes('cancelled') ? '#721c24' : '#155724',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: `1px solid ${bookingStatusChange.includes('cancelled') ? '#f5c6cb' : '#c3e6cb'}`,
                fontWeight: '500'
            }}>
            📢 {bookingStatusChange}
          </div>)}
        
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1>Welcome {(user === null || user === void 0 ? void 0 : user.name) || 'Traveler'}! 👋</h1>
            <p>Book your next journey with Fly High</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>{stats.totalBookings}</h3>
              <p>Total Bookings</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✈️</div>
            <div className="stat-content">
              <h3>{stats.upcomingTrips}</h3>
              <p>Upcoming Trips</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>₹{stats.totalSpent.toLocaleString()}</h3>
              <p>Total Spent</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🛫</div>
            <div className="stat-content">
              <h3>{stats.availableFlights}</h3>
              <p>Available Flights</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button onClick={handleViewAllFlights} className="action-btn primary">
              <span className="action-icon">✈️</span>
              <span className="action-label">Browse Flights</span>
            </button>
            
            <button onClick={handleViewProfile} className="action-btn secondary">
              <span className="action-icon">📄</span>
              <span className="action-label">View Profile</span>
            </button>
            
            <button onClick={() => navigate('/search')} className="action-btn secondary">
              <span className="action-icon">🔍</span>
              <span className="action-label">Search Flights</span>
            </button>
            
            <button onClick={() => navigate('/payment-history')} className="action-btn secondary">
              <span className="action-icon">💳</span>
              <span className="action-label">Payment History</span>
            </button>
          </div>
        </div>

        {/* Search Filters */}
        <div className="search-section">
          <div className="section-header">
            <h2>Search Flights</h2>
          </div>
          <div className="search-filters">
            <div className="filter-group">
              <label htmlFor="source">From:</label>
              <input type="text" id="source" name="source" value={searchFilters.source} onChange={handleSearchChange} placeholder="Enter source city" className="filter-input"/>
            </div>
            <div className="filter-group">
              <label htmlFor="destination">To:</label>
              <input type="text" id="destination" name="destination" value={searchFilters.destination} onChange={handleSearchChange} placeholder="Enter destination city" className="filter-input"/>
            </div>
            <div className="filter-group">
              <label htmlFor="date">Departure Date:</label>
              <input type="date" id="date" name="date" value={searchFilters.date} onChange={handleSearchChange} min={new Date().toISOString().split('T')[0]} className="filter-input"/>
            </div>
            <div className="filter-group">
              <label htmlFor="time">Departure Time:</label>
              <input type="time" id="time" name="time" value={searchFilters.time} onChange={handleSearchChange} className="filter-input"/>
            </div>
            <div className="filter-group">
              <button onClick={handleSearch} className="search-btn">
                🔍 Search
              </button>
            </div>
          </div>
        </div>

        {/* Featured Flights */}
        <div className="featured-section">
          <div className="section-header">
            <h2>All Flights ({filteredFlights.length})</h2>
            <button onClick={handleViewAllFlights} className="view-all-btn">
              View All Flights
            </button>
          </div>
          
          <div className="featured-flights">
            {filteredFlights.map((flight) => {
            const displayStatus = getFlightDisplayStatus(flight);
            const bookable = isFlightBookable(flight);
            return (<div key={flight.id} className="featured-flight-card">
                <div className="flight-header">
                  <div className="flight-info">
                    <h4>{flight.flightNumber}</h4>
                    <p>FlyHigh Airlines</p>
                    <span className={`flight-status-pill ${displayStatus.toLowerCase()}`}>
                      {formatFlightDisplayStatus(displayStatus)}
                    </span>
                  </div>
                  <div className="flight-price">
                    <span className="price">₹{flight.price.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flight-route-mini">
                  <span className="route-city">{flight.source}</span>
                  <span className="route-arrow">→</span>
                  <span className="route-city">{flight.destination}</span>
                </div>
                
                <div className="flight-details">
                  <div className="flight-time">
                    <span>Departure: {formatDateTime(flight.departureTime)}</span>
                    <span>Arrival: {formatDateTime(flight.arrivalTime)}</span>
                  </div>
                  <div className="flight-seats">
                    <span>Available Seats: {flight.seatsAvailable}</span>
                  </div>
                </div>
                
                <button onClick={() => handleBookFlight(flight.id)} className="book-now-btn" disabled={!bookable} title={displayStatus === 'CANCELLED'
                    ? 'This flight has been cancelled'
                    : displayStatus === 'DEPARTED'
                        ? 'This flight has already departed'
                        : flight.seatsAvailable === 0
                            ? 'No seats available'
                            : 'Book this flight'}>
                  {!bookable
                    ? displayStatus === 'CANCELLED'
                        ? 'Flight Cancelled'
                        : displayStatus === 'DEPARTED'
                            ? 'Departed'
                            : 'Sold Out'
                    : 'Book Now'}
                </button>
              </div>);
        })}
          </div>
        </div>

        {/* Recent Bookings */}
        {recentBookings.length > 0 && (<div className="recent-bookings">
            <div className="section-header">
              <h2>Recent Bookings</h2>
              <button onClick={handleViewProfile} className="view-all-btn">
                View All
              </button>
            </div>
            
            <div className="bookings-list">
              {recentBookings.map((booking) => {
                var _a;
                const showCancel = booking.status === 'CONFIRMED' &&
                    ((_a = booking.flight) === null || _a === void 0 ? void 0 : _a.status) !== 'CANCELLED' &&
                    canCustomerCancel(booking.flight.departureTime);
                const note = getBookingStatusNote(booking);
                const isRefundNotice = note === null || note === void 0 ? void 0 : note.includes('full refund');
                return (<div key={booking.id} className="booking-item">
                    <div className="booking-info">
                      <h4>{booking.flight.flightNumber}</h4>
                      <p>{booking.flight.source} → {booking.flight.destination}</p>
                    </div>
                    <div className="booking-status">
                      <div className={`status-badge ${booking.status.toLowerCase()}`}>
                        {booking.status === 'CONFIRMED' && <span style={{ marginRight: '4px' }}>✅</span>}
                        {booking.status === 'CANCELLED' && <span style={{ marginRight: '4px' }}>❌</span>}
                        {booking.status === 'PENDING' && <span style={{ marginRight: '4px' }}>⏳</span>}
                        {booking.status}
                      </div>
                      {note && (<div style={{
                            fontSize: '12px',
                            color: isRefundNotice ? '#856404' : '#6c757d',
                            marginTop: '4px',
                            fontStyle: 'italic',
                            backgroundColor: isRefundNotice ? '#fff3cd' : 'transparent',
                            padding: isRefundNotice ? '6px 8px' : 0,
                            borderRadius: isRefundNotice ? '4px' : 0,
                            border: isRefundNotice ? '1px solid #ffeeba' : 'none',
                        }}>
                          {isRefundNotice && '💰 '}{note}
                        </div>)}
                      {showCancel && (<button type="button" onClick={() => handleCancelBooking(booking.id)} style={{
                            marginTop: '8px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            backgroundColor: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}>
                          Cancel Ticket
                        </button>)}
                    </div>
                  </div>);
            })}
            </div>
          </div>)}
      </div>
    </div>);
};
export default DashboardPage;
