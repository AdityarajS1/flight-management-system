-- Flight Management System - Complete MySQL Schema
-- This script creates all tables, indexes, constraints, and sample data
-- Run this once to initialize the database

-- Start transaction for atomic execution
START TRANSACTION;

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS passengers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS flights;

-- Create flights table
CREATE TABLE flights (
    id INT PRIMARY KEY AUTO_INCREMENT,
    flight_number VARCHAR(50) NOT NULL UNIQUE,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    seats_available INT NOT NULL DEFAULT 0,
    status ENUM('SCHEDULED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_flight_price CHECK (price > 0),
    CONSTRAINT chk_seats_available CHECK (seats_available >= 0),
    CONSTRAINT chk_departure_arrival CHECK (arrival_time > departure_time)
);

-- Create users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255),
    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    auth_provider ENUM('LOCAL', 'GOOGLE') NOT NULL DEFAULT 'LOCAL',
    verification_token VARCHAR(255),
    phone VARCHAR(20),
    otp VARCHAR(10),
    otp_generated_at DATETIME,
    otp_expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_email_format CHECK (email LIKE '%@%.%'),
    CONSTRAINT chk_role CHECK (role IN ('USER', 'ADMIN')),
    CONSTRAINT chk_auth_provider CHECK (auth_provider IN ('LOCAL', 'GOOGLE'))
);

-- Create passengers table
CREATE TABLE passengers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    user_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create bookings table
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    flight_id INT NOT NULL,
    passenger_id INT NOT NULL,
    user_id INT,
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    cancellation_date DATETIME,
    cancellation_reason VARCHAR(255),
    cancelled_by ENUM('CUSTOMER', 'ADMIN'),
    status ENUM('CONFIRMED', 'CANCELLED', 'PENDING') DEFAULT 'CONFIRMED',
    total_price DECIMAL(10, 2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_booking_status CHECK (status IN ('CONFIRMED', 'CANCELLED', 'PENDING')),
    CONSTRAINT chk_booking_price CHECK (total_price >= 0)
);

-- Create payments table
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('RAZORPAY', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING') NOT NULL,
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    transaction_id VARCHAR(255),
    razorpay_order_id VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT chk_payment_amount CHECK (amount > 0),
    CONSTRAINT chk_payment_status CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'))
);

-- Create indexes for performance optimization
CREATE INDEX idx_flights_flight_number ON flights(flight_number);
CREATE INDEX idx_flights_source ON flights(source);
CREATE INDEX idx_flights_destination ON flights(destination);
CREATE INDEX idx_flights_departure_time ON flights(departure_time);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE INDEX idx_passengers_user_id ON passengers(user_id);
CREATE INDEX idx_passengers_email ON passengers(email);

CREATE INDEX idx_bookings_flight_id ON bookings(flight_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_passenger_id ON bookings(passenger_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- Insert sample flights
INSERT INTO flights (flight_number, source, destination, departure_time, arrival_time, price, seats_available)
VALUES 
('AI101', 'Mumbai', 'Delhi', '2026-04-20 10:00:00', '2026-04-20 12:00:00', 5000.00, 100),
('AI202', 'Pune', 'Bangalore', '2026-04-21 15:00:00', '2026-04-21 17:00:00', 4000.00, 80),
('AI303', 'Delhi', 'Chennai', '2026-04-22 09:00:00', '2026-04-22 11:30:00', 6000.00, 120),
('AI404', 'Bangalore', 'Mumbai', '2026-04-23 14:00:00', '2026-04-23 16:00:00', 4500.00, 90),
('AI505', 'Kolkata', 'Mumbai', '2026-04-24 08:00:00', '2026-04-24 10:30:00', 5500.00, 110),
('AI606', 'Chennai', 'Delhi', '2026-04-25 11:00:00', '2026-04-25 13:30:00', 6500.00, 95);

-- Note: The admin user will be created automatically by Spring Boot
-- using the credentials: admin@flyhigh.com / Admin@123
-- Role: ADMIN, Verified: true, Active: true

-- Commit transaction
COMMIT;

-- Display success message
SELECT 'Database schema created successfully!' AS message;
SELECT COUNT(*) AS total_flights FROM flights;
