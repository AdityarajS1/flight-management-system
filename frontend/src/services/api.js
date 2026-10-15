import axios from 'axios';
import { getStoredToken } from '../utils/auth';
const API_BASE_URL = '';
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
api.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
export const flightService = {
    getAllFlights: async () => {
        try {
            console.log('Making API call to /api/flights');
            const response = await api.get('/api/flights');
            console.log('API response status:', response.status);
            console.log('API response data:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('API call failed:', error);
            if (error instanceof Error) {
                console.error('Error details:', error.message);
            }
            throw error;
        }
    },
    getFlightById: async (id) => {
        const response = await api.get(`/api/flights/${id}`);
        return response.data;
    },
    getAllFlightsAdmin: async () => {
        const response = await api.get('/api/flights/all');
        return response.data;
    },
    searchFlights: async (source, destination, departureDate, departureTime) => {
        const params = new URLSearchParams({
            source,
            destination,
        });
        if (departureDate) {
            params.append('departureDate', departureDate);
        }
        if (departureTime) {
            params.append('departureTime', departureTime);
        }
        const response = await api.get(`/api/flights/search?${params.toString()}`);
        return response.data;
    },
    addFlight: async (flight) => {
        const response = await api.post('/api/flights', flight);
        return response.data;
    },
    updateFlight: async (id, flight) => {
        const response = await api.put(`/api/flights/${id}`, flight);
        return response.data;
    },
    deleteFlight: async (id) => {
        await api.delete(`/api/flights/${id}`);
    },
    cancelFlight: async (id) => {
        const response = await api.post(`/api/flights/${id}/cancel`);
        return response.data;
    },
};
export const bookingService = {
    bookTicket: async (flightId, passenger) => {
        const response = await api.post(`/api/bookings/${flightId}`, passenger);
        return response.data;
    },
    cancelBooking: async (bookingId, userId) => {
        const response = await api.post(`/api/bookings/${bookingId}/cancel`, { userId });
        return response.data;
    },
    getUserBookings: async (userId) => {
        const response = await api.get(`/api/bookings/user/${userId}`);
        return response.data;
    },
    bookTicketDemo: async (flightId, passenger, userId) => {
        const response = await api.post(`/api/bookings/${flightId}/demo`, {
            ...passenger,
            userId: userId !== null && userId !== void 0 ? userId : passenger.userId,
        });
        const data = response.data;
        if (data.booking) {
            return data.booking;
        }
        return data;
    },
};
export const paymentService = {
    getUserPayments: async (userId) => {
        const response = await api.get(`/api/payments/user/${userId}`);
        return response.data;
    },
    getTotalSpent: async (userId) => {
        var _a;
        const response = await api.get(`/api/payments/user/${userId}/total-spent`);
        return (_a = response.data.totalSpent) !== null && _a !== void 0 ? _a : 0;
    },
};
export const authService = {
    login: async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });
        return response.data;
    },
};
export const adminService = {
    getDashboardStats: async () => {
        const response = await api.get('/api/admin/dashboard');
        return response.data;
    },
};
export const healthService = {
    checkHealth: async () => {
        const response = await api.get('/api/public/info');
        return response.data;
    },
};
