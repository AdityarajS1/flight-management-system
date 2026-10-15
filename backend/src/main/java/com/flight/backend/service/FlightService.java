package com.flight.backend.service;

import com.flight.backend.model.Flight;
import com.flight.backend.model.FlightStatus;
import com.flight.backend.repository.FlightRepository;
import com.flight.backend.util.FlightDateTimeUtil;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class FlightService {

    private final FlightRepository flightRepository;

    public FlightService(FlightRepository flightRepository) {
        this.flightRepository = flightRepository;
    }

    public Flight addFlight(Flight flight) {
        validateFlightData(flight);
        
        // Check if flight number already exists
        if (flightRepository.existsByFlightNumber(flight.getFlightNumber())) {
            throw new IllegalArgumentException("Flight number already exists: " + flight.getFlightNumber());
        }
        
        return flightRepository.save(flight);
    }

    public List<Flight> getAllFlights() {
        return getFlightsForBrowse();
    }

    /** All flights for user browse (includes scheduled, cancelled, and departed). */
    public List<Flight> getFlightsForBrowse() {
        return flightRepository.findAll().stream()
                .sorted(Comparator.comparing(f -> FlightDateTimeUtil.parseDepartureTime(f.getDepartureTime())))
                .toList();
    }

    public List<Flight> getAllFlightsIncludingExpired() {
        return flightRepository.findAll();
    }

    public List<Flight> getActiveFlights() {
        return flightRepository.findAll().stream()
                .filter(flight -> flight.getStatus() == FlightStatus.SCHEDULED)
                .filter(flight -> FlightDateTimeUtil.isUpcoming(flight.getDepartureTime()))
                .toList();
    }

    public Flight getFlightById(int id) {
        return flightRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Flight not found with ID: " + id));
    }

    public Flight updateFlight(int id, Flight updatedFlight) {
        validateFlightData(updatedFlight);
        
        Flight existingFlight = getFlightById(id);
        
        // Check if flight number is being changed and if it conflicts with existing flights
        if (!Objects.equals(existingFlight.getFlightNumber(), updatedFlight.getFlightNumber()) &&
            flightRepository.existsByFlightNumber(updatedFlight.getFlightNumber())) {
            throw new IllegalArgumentException("Flight number already exists: " + updatedFlight.getFlightNumber());
        }
        
        // Update flight details
        existingFlight.setFlightNumber(updatedFlight.getFlightNumber());
        existingFlight.setSource(updatedFlight.getSource());
        existingFlight.setDestination(updatedFlight.getDestination());
        existingFlight.setDepartureTime(updatedFlight.getDepartureTime());
        existingFlight.setArrivalTime(updatedFlight.getArrivalTime());
        existingFlight.setPrice(updatedFlight.getPrice());
        
        // Validate seat availability
        if (updatedFlight.getSeatsAvailable() < 0) {
            throw new IllegalArgumentException("Seats available cannot be negative");
        }
        existingFlight.setSeatsAvailable(updatedFlight.getSeatsAvailable());
        
        return flightRepository.save(existingFlight);
    }

    public void deleteFlight(int id) {
        getFlightById(id);
        flightRepository.deleteById(id);
    }

    public Flight cancelFlight(int id) {
        Flight flight = getFlightById(id);
        if (flight.getStatus() == FlightStatus.CANCELLED) {
            throw new IllegalArgumentException("Flight is already cancelled");
        }
        if (!FlightDateTimeUtil.isUpcoming(flight.getDepartureTime())) {
            throw new IllegalArgumentException("Cannot cancel a flight that has already departed");
        }
        flight.setStatus(FlightStatus.CANCELLED);
        return flightRepository.save(flight);
    }

    public List<Flight> searchFlights(String source, String destination, String departureDate, String departureTime) {
        if (source == null || source.trim().isEmpty() ||
            destination == null || destination.trim().isEmpty()) {
            throw new IllegalArgumentException("Source and destination cannot be empty");
        }

        return flightRepository.findBySourceAndDestination(source.trim(), destination.trim()).stream()
                .filter(flight -> FlightDateTimeUtil.matchesDateTimeFilter(
                        flight.getDepartureTime(), departureDate, departureTime))
                .sorted(Comparator.comparing(f -> FlightDateTimeUtil.parseDepartureTime(f.getDepartureTime())))
                .toList();
    }

    public void ensureFlightIsBookable(Flight flight) {
        if (flight.getStatus() == FlightStatus.CANCELLED) {
            throw new IllegalArgumentException("This flight has been cancelled and cannot be booked");
        }
        if (!FlightDateTimeUtil.isUpcoming(flight.getDepartureTime())) {
            throw new IllegalArgumentException("This flight has already departed and cannot be booked");
        }
    }
    
    private void validateFlightData(Flight flight) {
        if (flight == null) {
            throw new IllegalArgumentException("Flight data cannot be null");
        }
        
        if (flight.getFlightNumber() == null || flight.getFlightNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("Flight number cannot be empty");
        }
        
        if (flight.getSource() == null || flight.getSource().trim().isEmpty()) {
            throw new IllegalArgumentException("Source cannot be empty");
        }
        
        if (flight.getDestination() == null || flight.getDestination().trim().isEmpty()) {
            throw new IllegalArgumentException("Destination cannot be empty");
        }
        
        if (flight.getDepartureTime() == null || flight.getDepartureTime().trim().isEmpty()) {
            throw new IllegalArgumentException("Departure time cannot be empty");
        }
        
        if (flight.getArrivalTime() == null || flight.getArrivalTime().trim().isEmpty()) {
            throw new IllegalArgumentException("Arrival time cannot be empty");
        }
        
        if (flight.getPrice() <= 0) {
            throw new IllegalArgumentException("Price must be greater than 0");
        }
        
        if (flight.getSeatsAvailable() < 0) {
            throw new IllegalArgumentException("Seats available cannot be negative");
        }
        
        if (flight.getSource().equalsIgnoreCase(flight.getDestination())) {
            throw new IllegalArgumentException("Source and destination cannot be the same");
        }
    }
}
