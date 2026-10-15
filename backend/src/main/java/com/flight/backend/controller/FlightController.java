package com.flight.backend.controller;

import com.flight.backend.model.Flight;
import com.flight.backend.service.FlightService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flights")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:8085"})
public class FlightController {

    private final FlightService flightService;

    public FlightController(FlightService flightService) {
        this.flightService = flightService;
    }

    // Add Flight
    @PostMapping
    public Flight addFlight(@RequestBody Flight flight) {
        return flightService.addFlight(flight);
    }

    // Get active (upcoming) flights for users
    @GetMapping
    public List<Flight> getAllFlights() {
        return flightService.getActiveFlights();
    }

    // Get all flights including expired (admin)
    @GetMapping("/all")
    public List<Flight> getAllFlightsIncludingExpired() {
        return flightService.getAllFlightsIncludingExpired();
    }

    @GetMapping("/{id}")
    public Flight getFlightById(@PathVariable int id) {
        return flightService.getFlightById(id);
    }

    @PutMapping("/{id}")
    public Flight updateFlight(@PathVariable int id, @RequestBody Flight flight) {
        return flightService.updateFlight(id, flight);
    }

    @DeleteMapping("/{id}")
    public String deleteFlight(@PathVariable int id) {
        flightService.deleteFlight(id);
        return "Flight deleted successfully";
    }

    @PostMapping("/{id}/cancel")
    public Flight cancelFlight(@PathVariable int id) {
        return flightService.cancelFlight(id);
    }

    // Search upcoming flights with optional date/time filters
    @GetMapping("/search")
    public List<Flight> searchFlights(
            @RequestParam String source,
            @RequestParam String destination,
            @RequestParam(required = false) String departureDate,
            @RequestParam(required = false) String departureTime) {
        return flightService.searchFlights(source, destination, departureDate, departureTime);
    }
}
