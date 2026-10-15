import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookingService } from '../services/api';
import { getStoredUser } from '../utils/auth';
import './PaymentPage.css';
const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [flight, setFlight] = useState(null);
    const [passenger, setPassenger] = useState(null);
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    useEffect(() => {
        // Parse query parameters
        const params = new URLSearchParams(location.search);
        const flightData = params.get('flight');
        const passengerData = params.get('passenger');
        if (flightData && passengerData) {
            try {
                const parsedFlight = JSON.parse(decodeURIComponent(flightData));
                const parsedPassenger = JSON.parse(decodeURIComponent(passengerData));
                setFlight(parsedFlight);
                setPassenger(parsedPassenger);
            }
            catch (err) {
                setError('Invalid booking data provided.');
            }
        }
        else {
            setError('Missing booking information.');
        }
    }, [location.search]);
    const createRazorpayOrder = async () => {
        if (!flight)
            return;
        try {
            setLoading(true);
            const response = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    amount: Math.round(flight.price * 100),
                    currency: 'INR',
                    receipt: `receipt_${Date.now()}`,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                return data.order;
            }
            else {
                throw new Error(data.error || 'Failed to create payment order');
            }
        }
        catch (err) {
            setError('Failed to initialize payment. Please try again.');
            throw err;
        }
        finally {
            setLoading(false);
        }
    };
    const handlePayment = async () => {
        if (!flight || !passenger)
            return;
        try {
            setPaymentProcessing(true);
            setError(null);
            // Create Razorpay order
            const order = await createRazorpayOrder();
            // Initialize Razorpay
            const options = {
                key: 'rzp_test_SeL5tzDCHelgYG',
                amount: order.amount,
                currency: order.currency,
                name: 'FlyHigh Airlines',
                description: `Flight Booking - ${flight.flightNumber}`,
                order_id: order.orderId,
                handler: async (response) => {
                    try {
                        // Verify payment and create booking
                        const bookingData = await bookingService.bookTicket(flight.id, passenger);
                        setBooking(bookingData);
                        setPaymentSuccess(true);
                    }
                    catch (err) {
                        setError('Payment successful but booking failed. Please contact support.');
                        console.error('Booking error:', err);
                    }
                },
                prefill: {
                    name: passenger.name,
                    email: passenger.email,
                    contact: passenger.phone,
                },
                theme: {
                    color: '#667eea',
                },
                modal: {
                    ondismiss: () => {
                        setPaymentProcessing(false);
                    },
                },
            };
            const razorpay = new window.Razorpay(options);
            razorpay.open();
        }
        catch (err) {
            console.error('Payment error:', err);
        }
        finally {
            setPaymentProcessing(false);
        }
    };
    const handlePaymentDone = async () => {
        var _a, _b;
        if (!flight || !passenger)
            return;
        try {
            setPaymentProcessing(true);
            setError(null);
            const storedUser = getStoredUser();
            const bookingData = await bookingService.bookTicketDemo(flight.id, passenger, storedUser === null || storedUser === void 0 ? void 0 : storedUser.id);
            setBooking(bookingData);
            setPaymentSuccess(true);
        }
        catch (err) {
            const message = ((_b = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) ||
                'Payment processing failed. Please try again.';
            setError(message);
            console.error('Payment error:', err);
        }
        finally {
            setPaymentProcessing(false);
        }
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
    if (error && !flight) {
        return (<div className="payment-error">
        <div className="error-card">
          <h2>Payment Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>);
    }
    if (paymentSuccess && booking) {
        return (<div className="payment-success">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h2>Payment Successful!</h2>
          <p>Your booking has been confirmed.</p>
          
          <div className="booking-summary">
            <h3>Booking Details</h3>
            <div className="summary-item">
              <span className="label">Booking ID:</span>
              <span className="value">#{booking.id}</span>
            </div>
            <div className="summary-item">
              <span className="label">Flight:</span>
              <span className="value">{booking.flight.flightNumber}</span>
            </div>
            <div className="summary-item">
              <span className="label">Route:</span>
              <span className="value">{booking.flight.source} → {booking.flight.destination}</span>
            </div>
            <div className="summary-item">
              <span className="label">Passenger:</span>
              <span className="value">{booking.passenger.name}</span>
            </div>
            <div className="summary-item">
              <span className="label">Amount Paid:</span>
              <span className="value">Rs. {booking.totalAmount.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="success-actions">
            <button onClick={() => navigate('/dashboard')} className="dashboard-btn">
              Back to Dashboard
            </button>
            <button onClick={() => window.print()} className="print-btn">
              Print Ticket
            </button>
          </div>
        </div>
      </div>);
    }
    return (<div className="payment-page">
      <div className="container">
        <h1>Complete Your Payment</h1>
        
        {flight && passenger && (<div className="payment-container">
            <div className="payment-summary">
              <h2>Booking Summary</h2>
              
              <div className="flight-summary">
                <h3>Flight Details</h3>
                <div className="flight-info">
                  <div className="flight-header">
                    <span className="flight-number">{flight.flightNumber}</span>
                    <span className="airline">FlyHigh Airlines</span>
                  </div>
                  <div className="route">
                    <div className="departure">
                      <strong>{flight.source}</strong>
                      <span>{formatDateTime(flight.departureTime)}</span>
                    </div>
                    <div className="plane">✈</div>
                    <div className="arrival">
                      <strong>{flight.destination}</strong>
                      <span>{formatDateTime(flight.arrivalTime)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="passenger-summary">
                <h3>Passenger Details</h3>
                <div className="passenger-info">
                  <div className="info-row">
                    <span className="label">Name:</span>
                    <span className="value">{passenger.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Email:</span>
                    <span className="value">{passenger.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phone:</span>
                    <span className="value">{passenger.phone}</span>
                  </div>
                  {passenger.age && (<div className="info-row">
                      <span className="label">Age:</span>
                      <span className="value">{passenger.age}</span>
                    </div>)}
                  {passenger.gender && (<div className="info-row">
                      <span className="label">Gender:</span>
                      <span className="value">{passenger.gender}</span>
                    </div>)}
                </div>
              </div>
              
              <div className="fare-summary">
                <h3>Fare Details</h3>
                <div className="fare-breakdown">
                  <div className="fare-row">
                    <span className="label">Base Fare</span>
                    <span className="value">Rs. {flight.price.toLocaleString()}</span>
                  </div>
                  <div className="fare-row">
                    <span className="label">Taxes & Fees</span>
                    <span className="value">Rs. {Math.round(flight.price * 0.18).toLocaleString()}</span>
                  </div>
                  <div className="fare-row total">
                    <span className="label">Total Amount</span>
                    <span className="value">Rs. {Math.round(flight.price * 1.18).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="payment-section">
              <h2>Payment Method</h2>
              
              <div className="payment-options">
                <div className="payment-option selected">
                  <div className="option-header">
                    <div className="radio-button">
                      <input type="radio" name="payment" id="razorpay" checked readOnly/>
                      <label htmlFor="razorpay"></label>
                    </div>
                    <div className="option-info">
                      <h4>Credit/Debit Card</h4>
                      <p>Pay securely with Razorpay</p>
                    </div>
                  </div>
                  <div className="payment-icons">
                    <span>💳</span>
                    <span>📱</span>
                    <span>💻</span>
                  </div>
                </div>
                
                <div className="qr-code-section">
                  <h3>Scan QR Code to Pay</h3>
                  <div className="qr-code">
                    <div className="qr-placeholder">
                      <div className="qr-pattern">
                        <div className="qr-square"></div>
                        <div className="qr-square"></div>
                        <div className="qr-square"></div>
                        <div className="qr-square"></div>
                      </div>
                      <p>QR Code for UPI Payment</p>
                      <p className="amount">Rs. {Math.round(flight.price * 1.18).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {error && (<div className="error-message">
                  <p>{error}</p>
                </div>)}
              
              <div className="payment-actions">
                <button onClick={handlePayment} disabled={paymentProcessing || loading} className="pay-button">
                  {paymentProcessing ? 'Processing...' : `Pay Rs. ${Math.round(flight.price * 1.18).toLocaleString()}`}
                </button>
                
                <button onClick={handlePaymentDone} disabled={paymentProcessing} className="demo-pay-button">
                  Demo Payment (Skip Payment)
                </button>
                
                <button onClick={() => navigate(-1)} disabled={paymentProcessing} className="cancel-button">
                  Cancel
                </button>
              </div>
              
              <div className="security-info">
                <div className="security-icon">🔒</div>
                <p>Your payment information is secure and encrypted</p>
              </div>
            </div>
          </div>)}
      </div>
    </div>);
};
export default PaymentPage;
