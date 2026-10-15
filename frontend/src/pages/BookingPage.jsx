import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { flightService } from '../services/api';
import { getStoredUser } from '../utils/auth';
import './BookingPage.css';
const BookingPage = () => {
    const navigate = useNavigate();
    const { flightId } = useParams();
    const [flight, setFlight] = useState(null);
    const [passenger, setPassenger] = useState({
        name: '',
        email: '',
        phone: '',
        age: undefined,
        gender: ''
    });
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(null);
    const [error, setError] = useState(null);
    const [flightLoading, setFlightLoading] = useState(true);
    useEffect(() => {
        const storedUser = getStoredUser();
        if (storedUser) {
            setPassenger((prev) => ({
                ...prev,
                email: storedUser.email || prev.email,
                userId: storedUser.id,
            }));
        }
        if (flightId) {
            void fetchFlight(Number(flightId));
        }
        else {
            navigate('/flights', { replace: true });
        }
    }, [flightId, navigate]);
    const fetchFlight = async (flightId) => {
        try {
            setFlightLoading(true);
            const selectedFlight = await flightService.getFlightById(flightId);
            setFlight(selectedFlight);
            setError(null);
        }
        catch (err) {
            setError('Failed to fetch flight details.');
            console.error('Error fetching flight:', err);
        }
        finally {
            setFlightLoading(false);
        }
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPassenger((prev) => ({
            ...prev,
            [name]: name === 'age' ? (value ? Number(value) : undefined) : value,
        }));
    };
    const validateForm = () => {
        if (!passenger.name.trim()) {
            setError('Please enter passenger name.');
            return false;
        }
        if (!passenger.email.trim()) {
            setError('Please enter passenger email.');
            return false;
        }
        if (!passenger.phone.trim()) {
            setError('Please enter passenger phone number.');
            return false;
        }
        if (!passenger.email.includes('@')) {
            setError('Please enter a valid email address.');
            return false;
        }
        if (!passenger.age || passenger.age < 1 || passenger.age > 120) {
            setError('Please enter a valid age (1-120).');
            return false;
        }
        if (!passenger.gender) {
            setError('Please select gender.');
            return false;
        }
        return true;
    };
    const handleBooking = async (e) => {
        var _a;
        e.preventDefault();
        if (!flight) {
            setError('No flight selected.');
            return;
        }
        if (!validateForm()) {
            return;
        }
        if (flight.seatsAvailable === 0) {
            setError('No seats available on this flight.');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            // Redirect to payment page with flight and passenger data
            const storedUser = getStoredUser();
            const passengerPayload = {
                ...passenger,
                userId: (_a = storedUser === null || storedUser === void 0 ? void 0 : storedUser.id) !== null && _a !== void 0 ? _a : passenger.userId,
                email: passenger.email || (storedUser === null || storedUser === void 0 ? void 0 : storedUser.email) || '',
            };
            const flightData = encodeURIComponent(JSON.stringify(flight));
            const passengerData = encodeURIComponent(JSON.stringify(passengerPayload));
            navigate(`/payment?flight=${flightData}&passenger=${passengerData}`);
        }
        catch (err) {
            setError('Failed to proceed to payment. Please try again.');
            console.error('Error navigating to payment:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleReset = () => {
        setPassenger({ name: '', email: '', phone: '' });
        setBooking(null);
        setError(null);
    };
    if (flightLoading) {
        return (<div className="loading">
        <div className="spinner"></div>
        <p>Loading flight details...</p>
      </div>);
    }
    if (error && !flight) {
        return (<div className="error">
        <p>{error}</p>
        <button onClick={() => navigate('/flights')}>Back to Flights</button>
      </div>);
    }
    return (<div className="booking-page">
      <div className="container">
        <h1>Book Your Flight</h1>

        {flight && !booking && (<div className="booking-container">
            <div className="flight-summary">
              <h2>Flight Details</h2>
              <div className="flight-card">
                <div className="flight-header">
                  <h3>{flight.flightNumber}</h3>
                  <span className="price">Rs. {flight.price.toLocaleString()}</span>
                </div>
                <div className="flight-route">
                  <div className="route-point">
                    <strong>From:</strong> {flight.source}
                  </div>
                  <div className="route-arrow">to</div>
                  <div className="route-point">
                    <strong>To:</strong> {flight.destination}
                  </div>
                </div>
                <div className="flight-details">
                  <div className="detail">
                    <span className="label">Departure:</span>
                    <span>{new Date(flight.departureTime).toLocaleString()}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Arrival:</span>
                    <span>{new Date(flight.arrivalTime).toLocaleString()}</span>
                  </div>
                  <div className="detail seats">
                    <span className="label">Seats Available:</span>
                    <span className={`seats-count ${flight.seatsAvailable > 20 ? 'good' : flight.seatsAvailable > 0 ? 'limited' : 'none'}`}>
                      {flight.seatsAvailable}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="passenger-form">
              <h2>Passenger Information</h2>
              <form onSubmit={handleBooking}>
                <div className="form-group">
                  <label htmlFor="name">Full Name:</label>
                  <input type="text" id="name" name="name" value={passenger.name} onChange={handleInputChange} placeholder="Enter your full name" className="form-input" required/>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input type="email" id="email" name="email" value={passenger.email} onChange={handleInputChange} placeholder="Enter your email address" className="form-input" required/>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number:</label>
                  <input type="tel" id="phone" name="phone" value={passenger.phone} onChange={handleInputChange} placeholder="Enter your phone number" className="form-input" required/>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="age">Age:</label>
                    <input type="number" id="age" name="age" value={passenger.age || ''} onChange={handleInputChange} placeholder="Enter your age" className="form-input" min="1" max="120" required/>
                  </div>

                  <div className="form-group">
                    <label htmlFor="gender">Gender:</label>
                    <select id="gender" name="gender" value={passenger.gender} onChange={handleInputChange} className="form-input" required>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {error && (<div className="error-message">
                    <p>{error}</p>
                  </div>)}

                <div className="form-buttons">
                  <button type="submit" disabled={loading || flight.seatsAvailable === 0} className="book-btn">
                    {loading ? 'Booking...' : `Book Flight - Rs. ${flight.price.toLocaleString()}`}
                  </button>
                  <button type="button" onClick={handleReset} className="reset-btn">
                    Reset Form
                  </button>
                </div>
              </form>
            </div>
          </div>)}

        {booking && (<div className="booking-success">
            <div className="success-card">
              <h2>Booking Confirmed</h2>
              <div className="booking-details">
                <div className="detail">
                  <span className="label">Booking ID:</span>
                  <span>{booking.id}</span>
                </div>
                <div className="detail">
                  <span className="label">Flight:</span>
                  <span>{booking.flight.flightNumber} - {booking.flight.source} to {booking.flight.destination}</span>
                </div>
                <div className="detail">
                  <span className="label">Passenger:</span>
                  <span>{booking.passenger.name}</span>
                </div>
                <div className="detail">
                  <span className="label">Email:</span>
                  <span>{booking.passenger.email}</span>
                </div>
                <div className="detail">
                  <span className="label">Phone:</span>
                  <span>{booking.passenger.phone}</span>
                </div>
                <div className="detail">
                  <span className="label">Booking Date:</span>
                  <span>{new Date(booking.bookingDate).toLocaleString()}</span>
                </div>
                <div className="detail">
                  <span className="label">Status:</span>
                  <span className="status confirmed">{booking.status}</span>
                </div>
              </div>
              <div className="success-actions">
                <button onClick={() => navigate('/dashboard')} className="home-btn">
                  Back to Home
                </button>
                <button onClick={() => navigate('/search')} className="search-btn">
                  Search More Flights
                </button>
              </div>
            </div>
          </div>)}
      </div>
    </div>);
};
export default BookingPage;
