import React, { useCallback, useEffect, useState } from 'react';
import { adminService, authService, flightService } from '../services/api';
import { clearStoredAuth, getStoredUser, isAdminUser, storeAuth } from '../utils/auth';
import UserManagement from '../components/UserManagement';
import BookingManagement from '../components/BookingManagement';
import { getFlightDisplayStatus, formatFlightDisplayStatus, } from '../utils/flightBookingUtils';
import './AdminPage.css';
const emptyFlightForm = {
    flightNumber: '',
    source: '',
    destination: '',
    departureTime: '',
    arrivalTime: '',
    price: '',
    seatsAvailable: '',
};
const AdminPage = ({ onLogout }) => {
    var _a, _b, _c, _d, _e;
    const [flights, setFlights] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loginLoading, setLoginLoading] = useState(false);
    const [savingFlight, setSavingFlight] = useState(false);
    const [error, setError] = useState(null);
    const [showFlightForm, setShowFlightForm] = useState(false);
    const [editingFlightId, setEditingFlightId] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [credentials, setCredentials] = useState({
        email: ((_a = getStoredUser()) === null || _a === void 0 ? void 0 : _a.email) || '',
        password: '',
    });
    const [flightForm, setFlightForm] = useState(emptyFlightForm);
    const handleLogout = useCallback(() => {
        if (onLogout) {
            onLogout();
        }
        else {
            clearStoredAuth();
            window.location.replace('/login');
        }
    }, [onLogout]);
    const fetchAdminData = useCallback(async () => {
        var _a;
        try {
            setLoading(true);
            setError(null);
            const [flightsData, statsResponse] = await Promise.all([
                flightService.getAllFlightsAdmin(),
                adminService.getDashboardStats(),
            ]);
            setFlights(flightsData);
            setStats(statsResponse.data);
            // Fetch recent bookings for the dashboard
            try {
                const bookingsData = statsResponse.data.recentBookings || [];
                setBookings(bookingsData);
            }
            catch (err) {
                console.log('Bookings/Users data not available:', err);
            }
        }
        catch (err) {
            const status = typeof err === 'object' && err !== null && 'response' in err
                ? (_a = err.response) === null || _a === void 0 ? void 0 : _a.status
                : undefined;
            if (status === 401 || status === 403) {
                handleLogout();
                setError('Admin session expired. Please sign in again.');
            }
            else {
                setError('Failed to load admin data.');
            }
            console.error('Error loading admin data:', err);
        }
        finally {
            setLoading(false);
        }
    }, [handleLogout]);
    useEffect(() => {
        // Check if user is already authenticated as admin
        const storedUser = getStoredUser();
        if (storedUser && isAdminUser(storedUser)) {
            setIsAuthenticated(true);
            setCredentials({
                email: storedUser.email || '',
                password: '',
            });
        }
        else {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        if (isAuthenticated) {
            void fetchAdminData();
        }
        else {
            setLoading(false);
        }
    }, [isAuthenticated, fetchAdminData]);
    const handleCredentialChange = (e) => {
        const { name, value } = e.target;
        setCredentials((prev) => ({ ...prev, [name]: value }));
    };
    const handleFlightInputChange = (e) => {
        const { name, value } = e.target;
        setFlightForm((prev) => ({ ...prev, [name]: value }));
    };
    const validateFlightForm = () => {
        if (!flightForm.flightNumber.trim()) {
            setError('Please enter flight number.');
            return false;
        }
        if (!flightForm.source.trim()) {
            setError('Please enter source city.');
            return false;
        }
        if (!flightForm.destination.trim()) {
            setError('Please enter destination city.');
            return false;
        }
        if (!flightForm.departureTime) {
            setError('Please enter departure time.');
            return false;
        }
        if (!flightForm.arrivalTime) {
            setError('Please enter arrival time.');
            return false;
        }
        if (!flightForm.price || Number(flightForm.price) <= 0) {
            setError('Please enter a valid price.');
            return false;
        }
        if (!flightForm.seatsAvailable || Number(flightForm.seatsAvailable) <= 0) {
            setError('Please enter valid number of seats.');
            return false;
        }
        return true;
    };
    const resetFlightForm = () => {
        setFlightForm(emptyFlightForm);
        setEditingFlightId(null);
        setShowFlightForm(false);
    };
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            setLoginLoading(true);
            setError(null);
            const response = await authService.login(credentials.email, credentials.password);
            if (response.error) {
                throw new Error(response.error);
            }
            if (response.role !== 'ADMIN') {
                throw new Error('This account does not have admin access.');
            }
            if (!response.token || !response.email) {
                throw new Error('Login response is missing required authentication data.');
            }
            storeAuth(response.token, {
                id: response.id,
                email: response.email,
                role: response.role,
                verified: response.verified,
            });
            setCredentials((prev) => ({ ...prev, password: '' }));
            setIsAuthenticated(true);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Admin login failed.';
            setError(message);
        }
        finally {
            setLoginLoading(false);
        }
    };
    useEffect(() => {
        setIsAuthenticated(isAdminUser(getStoredUser()));
    }, []);
    const handleSaveFlight = async (e) => {
        e.preventDefault();
        if (!validateFlightForm()) {
            return;
        }
        try {
            setSavingFlight(true);
            setError(null);
            const payload = {
                ...flightForm,
                price: Number(flightForm.price),
                seatsAvailable: Number(flightForm.seatsAvailable),
            };
            if (editingFlightId !== null) {
                await flightService.updateFlight(editingFlightId, payload);
            }
            else {
                await flightService.addFlight(payload);
            }
            resetFlightForm();
            await fetchAdminData();
        }
        catch (err) {
            setError(`Failed to ${editingFlightId !== null ? 'update' : 'add'} flight.`);
            console.error('Error saving flight:', err);
        }
        finally {
            setSavingFlight(false);
        }
    };
    const handleEditFlight = (flight) => {
        setFlightForm({
            flightNumber: flight.flightNumber,
            source: flight.source,
            destination: flight.destination,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            price: String(flight.price),
            seatsAvailable: String(flight.seatsAvailable),
        });
        setEditingFlightId(flight.id);
        setShowFlightForm(true);
        setError(null);
    };
    const handleCancelFlight = async (flightId, flightNumber) => {
        var _a;
        if (!window.confirm(`Cancel flight ${flightNumber}? Existing bookings will remain in Booking Management; only the flight status will change to Cancelled.`)) {
            return;
        }
        try {
            setError(null);
            await flightService.cancelFlight(flightId);
            await fetchAdminData();
        }
        catch (err) {
            const message = err && typeof err === 'object' && 'response' in err
                ? (_a = err.response) === null || _a === void 0 ? void 0 : _a.data
                : null;
            const text = typeof message === 'string'
                ? message
                : message && typeof message === 'object' && 'message' in message
                    ? message.message
                    : 'Failed to cancel flight.';
            setError(text || 'Failed to cancel flight.');
            console.error('Error cancelling flight:', err);
        }
    };
    if (!isAuthenticated) {
        return (<div className="admin-page">
        <div className="container">
          <div className="admin-login-card">
            <h1>Admin Login</h1>
            <p className="admin-subtitle">Sign in to manage flights and view booking statistics.</p>
            {error && (<div className="error-message">
                <p>{error}</p>
              </div>)}
            <form onSubmit={handleLogin} className="admin-login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" value={credentials.email} onChange={handleCredentialChange} className="form-input" required/>
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" value={credentials.password} onChange={handleCredentialChange} className="form-input" required/>
              </div>
              <button type="submit" className="submit-btn" disabled={loginLoading}>
                {loginLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>);
    }
    if (loading) {
        return (<div className="loading">
        <div className="spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>);
    }
    return (<div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <div className="header-content">
            <h1 className="app-title">Fly High</h1>
            <h2 className="dashboard-title">Admin Dashboard</h2>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            Dashboard
          </button>
          <button className={`tab-btn ${activeTab === 'flights' ? 'active' : ''}`} onClick={() => setActiveTab('flights')}>
            Manage Flights
          </button>
          <button className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
            Manage Bookings
          </button>
          <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            Manage Users
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (<div className="dashboard-content">
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Flights</span>
                <strong>{String((_b = stats.totalFlights) !== null && _b !== void 0 ? _b : 0)}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Bookings</span>
                <strong>{String((_c = stats.totalBookings) !== null && _c !== void 0 ? _c : 0)}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Users</span>
                <strong>{String((_d = stats.totalUsers) !== null && _d !== void 0 ? _d : 0)}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Revenue</span>
                <strong>Rs. {Number((_e = stats.totalRevenue) !== null && _e !== void 0 ? _e : 0).toLocaleString()}</strong>
              </div>
            </div>
            
            {/* Recent Bookings Preview */}
            {bookings.length > 0 && (<div className="recent-bookings">
                <h3>Recent Bookings</h3>
                <div className="bookings-preview">
                  {bookings.slice(0, 5).map((booking) => (<div key={booking.id} className="booking-preview-card">
                      <div className="booking-info">
                        <span className="booking-id">#{booking.id}</span>
                        <span className="flight-info">{booking.flight.flightNumber}</span>
                        <span className="route">{booking.flight.source} → {booking.flight.destination}</span>
                      </div>
                      <div className="booking-details">
                        <span className="passenger">{booking.passenger.name}</span>
                        <span className="amount">Rs. {booking.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>))}
                </div>
              </div>)}
          </div>)}

        {/* Flights Management Tab */}
        {activeTab === 'flights' && (<div className="flights-content">
            <div className="admin-actions">
              <button onClick={() => {
                if (showFlightForm) {
                    resetFlightForm();
                }
                else {
                    setShowFlightForm(true);
                    setError(null);
                }
            }} className="add-flight-btn">
                {showFlightForm ? 'Cancel' : 'Add New Flight'}
              </button>
            </div>

            {error && (<div className="error-message">
                <p>{error}</p>
              </div>)}

            {showFlightForm && (<div className="add-flight-form">
                <h2>{editingFlightId !== null ? 'Update Flight' : 'Add New Flight'}</h2>
                <form onSubmit={handleSaveFlight}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="flightNumber">Flight Number</label>
                      <input id="flightNumber" name="flightNumber" value={flightForm.flightNumber} onChange={handleFlightInputChange} className="form-input" required/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="source">Source</label>
                      <input id="source" name="source" value={flightForm.source} onChange={handleFlightInputChange} className="form-input" required/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="destination">Destination</label>
                      <input id="destination" name="destination" value={flightForm.destination} onChange={handleFlightInputChange} className="form-input" required/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="departureTime">Departure Time</label>
                      <input id="departureTime" name="departureTime" type="datetime-local" value={flightForm.departureTime} onChange={handleFlightInputChange} className="form-input" required/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="arrivalTime">Arrival Time</label>
                      <input id="arrivalTime" name="arrivalTime" type="datetime-local" value={flightForm.arrivalTime} onChange={handleFlightInputChange} className="form-input" required/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="price">Price (Rs.)</label>
                      <input id="price" name="price" type="number" min="0" step="0.01" value={flightForm.price} onChange={handleFlightInputChange} className="form-input" required/>
                    </div>
                    <div className="form-group">
                      <label htmlFor="seatsAvailable">Seats Available</label>
                      <input id="seatsAvailable" name="seatsAvailable" type="number" min="1" value={flightForm.seatsAvailable} onChange={handleFlightInputChange} className="form-input" required/>
                    </div>
                  </div>

                  <div className="form-buttons">
                    <button type="submit" className="submit-btn" disabled={savingFlight}>
                      {savingFlight ? 'Saving...' : editingFlightId !== null ? 'Update Flight' : 'Add Flight'}
                    </button>
                    <button type="button" onClick={resetFlightForm} className="cancel-btn">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>)}

            <div className="flights-management">
              <h2>Manage Flights</h2>
              {flights.length > 0 ? (<div className="flights-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Flight Number</th>
                        <th>Route</th>
                        <th>Departure</th>
                        <th>Arrival</th>
                        <th>Price</th>
                        <th>Seats</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flights.map((flight) => {
                    const displayStatus = getFlightDisplayStatus(flight);
                    const canCancelFlight = displayStatus === 'SCHEDULED';
                    return (<tr key={flight.id}>
                          <td>{flight.flightNumber}</td>
                          <td>{flight.source} to {flight.destination}</td>
                          <td>{new Date(flight.departureTime).toLocaleString()}</td>
                          <td>{new Date(flight.arrivalTime).toLocaleString()}</td>
                          <td>Rs. {flight.price.toLocaleString()}</td>
                          <td>
                            <span className={`seats-count ${flight.seatsAvailable > 20 ? 'good' : flight.seatsAvailable > 0 ? 'limited' : 'none'}`}>
                              {flight.seatsAvailable}
                            </span>
                          </td>
                          <td>
                            <span className={`status ${displayStatus.toLowerCase()}`}>
                              {formatFlightDisplayStatus(displayStatus)}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => handleEditFlight(flight)} className="edit-btn" title="Edit flight">
                              Edit
                            </button>
                            {canCancelFlight && (<button onClick={() => handleCancelFlight(flight.id, flight.flightNumber)} className="delete-btn" title="Cancel flight (bookings are kept; customers get full refund message)">
                                Cancel Flight
                              </button>)}
                          </td>
                        </tr>);
                })}
                    </tbody>
                  </table>
                </div>) : (<div className="no-flights">
                  <p>No flights available. Add your first flight.</p>
                </div>)}
            </div>
          </div>)}

        {/* Bookings Management Tab */}
        {activeTab === 'bookings' && (<BookingManagement />)}

        {/* Users Management Tab */}
        {activeTab === 'users' && (<UserManagement />)}
      </div>
    </div>);
};
export default AdminPage;
