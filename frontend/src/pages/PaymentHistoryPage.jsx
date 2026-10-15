import React, { useState, useEffect } from 'react';
import { paymentService } from '../services/api';
import { getStoredUser } from '../utils/auth';
import './PaymentHistoryPage.css';
const PaymentHistoryPage = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        fetchPaymentHistory();
    }, []);
    const fetchPaymentHistory = async () => {
        try {
            const user = getStoredUser();
            if (!(user === null || user === void 0 ? void 0 : user.id)) {
                setError('Please login to view payment history');
                return;
            }
            const data = await paymentService.getUserPayments(user.id);
            setPayments(data);
        }
        catch (err) {
            setError('Failed to load payment history. Please try again.');
            console.error('Payment history error:', err);
        }
        finally {
            setLoading(false);
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
            case 'SUCCESS':
            case 'COMPLETED':
                return '#28a745';
            case 'PENDING':
                return '#ffc107';
            case 'FAILED':
                return '#dc3545';
            default:
                return '#6c757d';
        }
    };
    if (loading) {
        return (<div className="payment-history-loading">
        <div className="spinner"></div>
        <p>Loading payment history...</p>
      </div>);
    }
    return (<div className="payment-history-page">
      <div className="container">
        <div className="page-header">
          <h1>💳 Payment History</h1>
          <p>View all your payment transactions</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {payments.length === 0 ? (<div className="no-payments">
            <div className="no-payments-icon">💳</div>
            <h4>No Payment History</h4>
            <p>You haven't made any payments yet. Start booking flights to see your payment history!</p>
          </div>) : (<div className="payments-grid">
            {payments.map((payment) => (<div key={payment.id} className="payment-card">
                <div className="payment-header">
                  <div className="payment-info">
                    <div className="payment-id">Payment ID: {payment.paymentId}</div>
                    <div className="payment-amount">₹{payment.amount.toLocaleString()}</div>
                  </div>
                  <div className="payment-status" style={{ color: getStatusColor(payment.status) }}>
                    {payment.status}
                  </div>
                </div>
                
                <div className="payment-details">
                  <div className="booking-info">
                    <p><strong>Booking ID:</strong> #{payment.bookingId}</p>
                    <p><strong>Flight:</strong> {payment.flightNumber}</p>
                    <p><strong>Route:</strong> {payment.source} → {payment.destination}</p>
                  </div>
                  
                  <div className="payment-meta">
                    <p><strong>Payment Date:</strong> {formatDate(payment.paymentDate)}</p>
                    <p><strong>Currency:</strong> {payment.currency}</p>
                  </div>
                </div>

                <div className="payment-footer">
                  <div className="payment-total">
                    <span className="total-label">Total Amount</span>
                    <span className="total-amount">₹{payment.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>))}
          </div>)}
      </div>
    </div>);
};
export default PaymentHistoryPage;
