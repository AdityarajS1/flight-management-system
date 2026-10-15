package com.flight.backend.repository;

import com.flight.backend.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Optional<Payment> findByRazorpayPaymentId(String razorpayPaymentId);
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    List<Payment> findByStatus(String status);

    @Query("SELECT p FROM Payment p JOIN FETCH p.booking b JOIN FETCH b.flight JOIN FETCH b.passenger " +
           "WHERE b.userId = :userId ORDER BY p.paymentDate DESC")
    List<Payment> findByBookingUserId(@Param("userId") int userId);

    @Query("SELECT p FROM Payment p JOIN FETCH p.booking b JOIN FETCH b.flight JOIN FETCH b.passenger " +
           "WHERE LOWER(b.passenger.email) = LOWER(:email) ORDER BY p.paymentDate DESC")
    List<Payment> findByPassengerEmail(@Param("email") String email);
}
