import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { flightService } from '../services/api';
import { getFlightDisplayStatus, isFlightBookable, formatFlightDisplayStatus, } from '../utils/flightBookingUtils';
import './FlightsPage.css';
const FlightsPage = () => {
    const navigate = useNavigate();
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetchAllFlights();
    }, []);
    const fetchAllFlights = async () => {
        try {
            setLoading(true);
            console.log('Fetching flights from API...');
            const allFlights = await flightService.getAllFlights();
            console.log('Flights fetched successfully:', allFlights);
            setFlights(allFlights);
            setError(null);
        }
        catch (err) {
            console.error('Error fetching flights:', err);
            setError(`Failed to load flights. Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        finally {
            setLoading(false);
        }
    };
    const formatDate = (dateTimeStr) => {
        const date = new Date(dateTimeStr.replace(' ', 'T'));
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        }).replace(',', '');
    };
    const formatTime = (dateTimeStr) => {
        const date = new Date(dateTimeStr.replace(' ', 'T'));
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    const getSeatStatus = (seats) => {
        if (seats === 0)
            return { class: 'none', text: 'Sold Out' };
        if (seats <= 10)
            return { class: 'limited', text: 'Limited' };
        return { class: 'good', text: 'Available' };
    };
    const handleBookFlight = (flightId) => {
        navigate(`/booking/${flightId}`);
    };
    if (loading) {
        return (<div className="flights-loading">
        <div className="spinner"></div>
        <p>Loading flights...</p>
      </div>);
    }
    return (<div className="flights-page">
      <div className="container">
        <div className="page-header">
          <h1>✈️ All Flights</h1>
          <p>Browse scheduled, cancelled, and departed flights. Only scheduled flights can be booked.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {flights.length === 0 ? (<div className="no-flights">
            <div className="no-flights-icon">✈️</div>
            <h4>No Flights Available</h4>
            <p>Currently there are no flights available. Please check back later.</p>
          </div>) : (<div className="flights-grid">
            {flights.map((flight) => {
                const seatStatus = getSeatStatus(flight.seatsAvailable);
                const displayStatus = getFlightDisplayStatus(flight);
                const bookable = isFlightBookable(flight);
                return (<div key={flight.id} className="flight-card">
                  <div className="flight-header">
                    <div className="airline-info">
                      <h3>{flight.flightNumber}</h3>
                      <span className="airline-name">FlyHigh Airlines</span>
                      <span className={`flight-status-tag ${displayStatus.toLowerCase()}`}>
                        {formatFlightDisplayStatus(displayStatus)}
                      </span>
                    </div>
                    <div className="price-info">
                      <span className="price">Rs. {flight.price.toLocaleString()}</span>
                      <span className="price-label">per person</span>
                    </div>
                  </div>

                  <div className="flight-route">
                    <div className="departure">
                      <div className="city">{flight.source}</div>
                      <div className="date">
                        {formatDate(flight.departureTime)}
                      </div>
                      <div className="time">
                        {formatTime(flight.departureTime)}
                      </div>
                    </div>
                    
                    <div className="route-visual">
                      <div className="plane-icon">✈</div>
                      <div className="route-line"></div>
                      <div className="duration">
                        {Math.round((new Date(flight.arrivalTime).getTime() -
                        new Date(flight.departureTime).getTime()) / (1000 * 60 * 60))}h
                      </div>
                    </div>
                    
                    <div className="arrival">
                      <div className="city">{flight.destination}</div>
                      <div className="date">
                        {formatDate(flight.arrivalTime)}
                      </div>
                      <div className="time">
                        {formatTime(flight.arrivalTime)}
                      </div>
                    </div>
                  </div>

                  <div className="flight-details">
                    <div className="detail-item">
                      <span className="label">Flight</span>
                      <span className="value">{flight.flightNumber}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Duration</span>
                      <span className="value">
                        {Math.round((new Date(flight.arrivalTime).getTime() -
                        new Date(flight.departureTime).getTime()) / (1000 * 60 * 60))}h 
                        {Math.round(((new Date(flight.arrivalTime).getTime() -
                        new Date(flight.departureTime).getTime()) / (1000 * 60)) % 60)}m
                      </span>
                    </div>
                    <div className="detail-item seats">
                      <span className="label">Seats</span>
                      <span className={`value ${seatStatus.class}`}>
                        {flight.seatsAvailable} {seatStatus.text}
                      </span>
                    </div>
                  </div>

                  <div className="flight-actions">
                    <button onClick={() => handleBookFlight(flight.id)} disabled={!bookable} className={`book-btn ${!bookable ? 'disabled' : ''}`}>
                      {!bookable
                        ? displayStatus === 'CANCELLED'
                            ? 'Flight Cancelled'
                            : displayStatus === 'DEPARTED'
                                ? 'Departed'
                                : 'Sold Out'
                        : 'Book Now'}
                    </button>
                  </div>
                </div>);
            })}
          </div>)}
      </div>
    </div>);
};
export default FlightsPage;
