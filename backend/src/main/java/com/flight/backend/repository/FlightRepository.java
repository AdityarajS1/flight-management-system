package com.flight.backend.repository;

import com.flight.backend.model.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Integer> {
    List<Flight> findBySourceAndDestination(String source, String destination);
    boolean existsByFlightNumber(String flightNumber);
    
    // Alternative method to ensure it works
    default boolean flightNumberExists(String flightNumber) {
        return existsByFlightNumber(flightNumber);
    }
}