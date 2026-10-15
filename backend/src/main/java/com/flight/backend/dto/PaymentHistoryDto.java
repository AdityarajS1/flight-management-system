package com.flight.backend.dto;

import java.time.LocalDateTime;

public class PaymentHistoryDto {
    private int id;
    private String paymentId;
    private double amount;
    private String currency;
    private String status;
    private LocalDateTime paymentDate;
    private int bookingId;
    private String flightNumber;
    private String source;
    private String destination;

    public PaymentHistoryDto() {}

    public PaymentHistoryDto(int id, String paymentId, double amount, String currency, String status,
                             LocalDateTime paymentDate, int bookingId, String flightNumber,
                             String source, String destination) {
        this.id = id;
        this.paymentId = paymentId;
        this.amount = amount;
        this.currency = currency;
        this.status = status;
        this.paymentDate = paymentDate;
        this.bookingId = bookingId;
        this.flightNumber = flightNumber;
        this.source = source;
        this.destination = destination;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }

    public int getBookingId() { return bookingId; }
    public void setBookingId(int bookingId) { this.bookingId = bookingId; }

    public String getFlightNumber() { return flightNumber; }
    public void setFlightNumber(String flightNumber) { this.flightNumber = flightNumber; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
}
