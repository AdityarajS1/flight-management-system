package com.flight.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @OneToOne
    @JoinColumn(name = "booking_id", unique = true)
    private Booking booking;

    private String paymentId;
    private String orderId;

    @Column(name = "transaction_id")
    private String transactionId;

    private double amount;
    private String currency;
    private String status;
    private String method;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod = "UPI";

    @Column(name = "payment_status")
    private String paymentStatus = "COMPLETED";

    private LocalDateTime paymentDate;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;

    // Getters & Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    @JsonIgnore
    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    @PrePersist
    @PreUpdate
    private void syncPaymentFields() {
        if (paymentMethod == null || paymentMethod.isBlank()) {
            paymentMethod = "UPI";
        }
        if (paymentStatus == null || paymentStatus.isBlank()) {
            paymentStatus = "COMPLETED";
        }
        if (transactionId == null || transactionId.isBlank()) {
            transactionId = paymentId != null ? paymentId : "TXN-" + System.currentTimeMillis();
        }
    }

    public LocalDateTime getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDateTime paymentDate) { this.paymentDate = paymentDate; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

    public String getRazorpaySignature() { return razorpaySignature; }
    public void setRazorpaySignature(String razorpaySignature) { this.razorpaySignature = razorpaySignature; }
}
