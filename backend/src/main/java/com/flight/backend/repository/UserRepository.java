package com.flight.backend.repository;

import com.flight.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByVerificationToken(String token);
    
    // Admin management methods
    java.util.List<User> findByRole(com.flight.backend.model.Role role);
    long countByRole(com.flight.backend.model.Role role);
}
