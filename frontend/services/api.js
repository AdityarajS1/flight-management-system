import axios from 'axios';
// For combined deployment, use relative URLs
const API_BASE_URL = '';
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
export const flightService = {
    getAllFlights: async () => {
        const response = await api.get('/flights');
        return response.data;
    },
    searchFlights: async (source, destination) => {
        const response = await api.get(`/flights/search?source=${source}&destination=${destination}`);
        return response.data;
    },
    addFlight: async (flight) => {
        const response = await api.post('/flights', flight);
        return response.data;
    },
    deleteFlight: async (id) => {
        await api.delete(`/flights/${id}`);
    },
};
export const bookingService = {
    bookTicket: async (flightId, passenger) => {
        const response = await api.post(`/bookings/${flightId}`, passenger);
        return response.data;
    },
};
export const healthService = {
    checkHealth: async () => {
        const response = await api.get('/test');
        return response.data;
    },
};
