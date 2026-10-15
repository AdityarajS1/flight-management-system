import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { flightService } from '../services/api';
import { getFlightDisplayStatus, isFlightBookable, formatFlightDisplayStatus, } from '../utils/flightBookingUtils';
import './SearchPage.css';
const SearchPage = () => {
    const navigate = useNavigate();
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [departureTime, setDepartureTime] = useState('');
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!source.trim() || !destination.trim()) {
            setError('Please enter both source and destination.');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const data = await flightService.searchFlights(source.trim(), destination.trim(), departureDate || undefined, departureTime || undefined);
            setFlights(data);
            setSearched(true);
        }
        catch (err) {
            setError('Failed to search flights. Please try again.');
            console.error('Error searching flights:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleReset = () => {
        setSource('');
        setDestination('');
        setDepartureDate('');
        setDepartureTime('');
        setFlights([]);
        setError(null);
        setSearched(false);
    };
    const today = new Date().toISOString().split('T')[0];
    return (<div className="search-page">
      <div className="container">
        <h1>Search Flights</h1>
        <p className="search-subtitle">Only upcoming flights are shown. Expired flights stay in the system but are hidden from search.</p>

        <form onSubmit={handleSearch} className="search-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="source">From (Source):</label>
              <input type="text" id="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Enter departure city" className="form-input" required/>
            </div>

            <div className="form-group">
              <label htmlFor="destination">To (Destination):</label>
              <input type="text" id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Enter destination city" className="form-input" required/>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="departureDate">Departure Date:</label>
              <input type="date" id="departureDate" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} min={today} className="form-input"/>
            </div>

            <div className="form-group">
              <label htmlFor="departureTime">Departure Time (from):</label>
              <input type="time" id="departureTime" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} className="form-input"/>
            </div>
          </div>

          <div className="form-buttons">
            <button type="submit" disabled={loading} className="search-btn">
              {loading ? 'Searching...' : 'Search Flights'}
            </button>
            <button type="button" onClick={handleReset} className="reset-btn">
              Reset
            </button>
          </div>
        </form>

        {error && (<div className="error-message">
            <p>{error}</p>
          </div>)}

        {loading && (<div className="loading">
            <div className="spinner"></div>
            <p>Searching flights...</p>
          </div>)}

        {searched && !loading && (<div className="search-results">
            <h2>Search Results</h2>
            {flights.length > 0 ? (<div className="flights-grid">
                {flights.map((flight) => {
                    const displayStatus = getFlightDisplayStatus(flight);
                    const bookable = isFlightBookable(flight);
                    return (<div key={flight.id} className="flight-card">
                    <div className="flight-header">
                      <h3>{flight.flightNumber}</h3>
                      <span className={`flight-status-tag ${displayStatus.toLowerCase()}`}>
                        {formatFlightDisplayStatus(displayStatus)}
                      </span>
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
                    <button className="book-btn" onClick={() => navigate(`/booking/${flight.id}`)} disabled={!bookable}>
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
              </div>) : (<div className="no-results">
                <p>No flights found from {source} to {destination}.</p>
                <p>Try different cities, date, or time.</p>
                <button onClick={() => navigate('/flights')} className="view-all-btn">
                  View All Available Flights
                </button>
              </div>)}
          </div>)}
      </div>
    </div>);
};
export default SearchPage;
