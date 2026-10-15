package com.flight.backend.repository;

import com.flight.backend.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Integer> {
    List<Booking> findByUserIdOrderByBookingDateDesc(int userId);
    List<Booking> findByPassenger_EmailIgnoreCaseOrderByBookingDateDesc(String email);
}
