import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { flightService } from '../services/api';
import './HomePage.css';
const HomePage = () => {
    const navigate = useNavigate();
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);
    useEffect(() => {
        const fetchFlights = async () => {
            try {
                setLoading(true);
                const data = await flightService.getAllFlights();
                setFlights(data);
                setError(null);
            }
            catch (err) {
                setError('Failed to fetch flights. Please try again later.');
                console.error('Error fetching flights:', err);
            }
            finally {
                setLoading(false);
            }
        };
        void fetchFlights();
    }, []);
    if (loading) {
        return (<div className="loading">
        <div className="spinner"></div>
        <p>Loading flights...</p>
      </div>);
    }
    if (error) {
        return (<div className="error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>);
    }
    return (<div className="home-page">
      <div className="container">
        <div className="page-header">
          <h1 className="app-title">Fly High</h1>
          <p className="page-subtitle">Available Flights - Your Journey Starts Here</p>
        </div>
        <div className="flights-grid">
          {flights.map((flight) => (<div key={flight.id} className="flight-card">
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
              <button className="book-btn" onClick={() => navigate(`/booking/${flight.id}`)} disabled={flight.seatsAvailable === 0}>
                {flight.seatsAvailable === 0 ? 'Sold Out' : 'Book Now'}
              </button>
            </div>))}
        </div>
        {flights.length === 0 && (<div className="no-flights">
            <p>No flights available at the moment.</p>
          </div>)}
      </div>
    </div>);
};
export default HomePage;
