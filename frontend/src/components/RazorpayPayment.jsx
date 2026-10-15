import React from 'react';
import { RAZORPAY_CONFIG } from '../config/razorpay';
const RazorpayPayment = ({ amount, bookingId: _bookingId, onSuccess, onFailure }) => {
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };
    const handlePayment = async () => {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
            onFailure('Razorpay SDK failed to load');
            return;
        }
        const options = {
            key: RAZORPAY_CONFIG.key,
            amount: amount * 100,
            currency: RAZORPAY_CONFIG.currency,
            name: RAZORPAY_CONFIG.name,
            description: RAZORPAY_CONFIG.description,
            image: RAZORPAY_CONFIG.image,
            handler: (response) => {
                onSuccess(response.razorpay_payment_id);
            },
            prefill: {
                name: 'Flight Booking',
                email: 'customer@example.com',
                contact: '9999999999'
            },
            theme: RAZORPAY_CONFIG.theme
        };
        const razorpay = new window.Razorpay(options);
        razorpay.open();
    };
    return (<div className="razorpay-payment">
      <button className="razorpay-btn" onClick={handlePayment} style={{
            backgroundColor: RAZORPAY_CONFIG.theme.color,
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
        }}>
        Pay Rs. {amount.toLocaleString()}
      </button>
    </div>);
};
export default RazorpayPayment;
