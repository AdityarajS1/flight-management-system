package com.flight.backend.service;

import com.flight.backend.dto.PaymentHistoryDto;
import com.flight.backend.model.Booking;
import com.flight.backend.model.Payment;
import com.flight.backend.repository.PaymentRepository;
import com.flight.backend.repository.UserRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Order;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final com.flight.backend.config.RazorpayConfig razorpayConfig;

    public PaymentService(PaymentRepository paymentRepository,
                          UserRepository userRepository,
                          EmailService emailService,
                          com.flight.backend.config.RazorpayConfig razorpayConfig) {
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.razorpayConfig = razorpayConfig;
    }

    private RazorpayClient getRazorpayClient() {
        String razorpayKeyId = razorpayConfig.getKey().getId();
        String razorpayKeySecret = razorpayConfig.getKey().getSecret();
        if (razorpayKeyId == null || razorpayKeyId.isBlank() || razorpayKeySecret == null || razorpayKeySecret.isBlank()) {
            throw new RuntimeException("Razorpay credentials are not configured");
        }
        try {
            return new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to initialize Razorpay client: " + e.getMessage());
        }
    }

    public Map<String, Object> createOrder(double amount, String currency, String receipt) {
        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amount * 100); // Razorpay expects amount in paise
            orderRequest.put("currency", currency);
            orderRequest.put("receipt", receipt);
            orderRequest.put("payment_capture", 1);

            Order order = getRazorpayClient().orders.create(orderRequest);

            return Map.of(
                "orderId", order.get("id"),
                "amount", order.get("amount"),
                "currency", order.get("currency"),
                "status", order.get("status")
            );

        } catch (RazorpayException e) {
            throw new RuntimeException("Failed to create Razorpay order: " + e.getMessage());
        }
    }

    public Payment verifyPayment(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            boolean isValidSignature = Utils.verifySignature(payload, razorpaySignature, razorpayConfig.getKey().getSecret());

            if (!isValidSignature) {
                throw new RuntimeException("Invalid payment signature");
            }

            Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId)
                    .orElseThrow(() -> new RuntimeException("Payment not found for order: " + razorpayOrderId));

            payment.setRazorpayPaymentId(razorpayPaymentId);
            payment.setRazorpaySignature(razorpaySignature);
            payment.setStatus("SUCCESS");
            payment.setPaymentDate(LocalDateTime.now());

            Booking booking = payment.getBooking();
            booking.setStatus(com.flight.backend.model.BookingStatus.CONFIRMED);
            booking.setTotalAmount(payment.getAmount());

            try {
                emailService.sendBookingConfirmationEmail(
                    booking.getPassenger().getEmail(),
                    booking.getPassenger().getName(),
                    booking.getFlight().getFlightNumber(),
                    "BK" + booking.getId()
                );
            } catch (Exception e) {
                System.err.println("Failed to send booking confirmation email: " + e.getMessage());
            }

            return paymentRepository.save(payment);

        } catch (Exception e) {
            throw new RuntimeException("Payment verification failed: " + e.getMessage());
        }
    }

    public Payment createDemoPayment(Booking booking) {
        String txnId = "DEMO-" + System.currentTimeMillis();
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(booking.getTotalAmount());
        payment.setCurrency("INR");
        payment.setStatus("SUCCESS");
        payment.setMethod("DEMO");
        payment.setPaymentMethod("UPI");
        payment.setPaymentStatus("COMPLETED");
        payment.setPaymentId(txnId);
        payment.setTransactionId(txnId);
        payment.setRazorpayOrderId("demo_order_" + booking.getId());
        payment.setPaymentDate(LocalDateTime.now());
        return paymentRepository.save(payment);
    }

    public Payment createPayment(Booking booking, double amount, String razorpayOrderId) {
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(amount);
        payment.setCurrency("INR");
        payment.setStatus("PENDING");
        payment.setMethod("RAZORPAY");
        payment.setPaymentMethod("RAZORPAY");
        payment.setPaymentStatus("PENDING");
        payment.setTransactionId(razorpayOrderId);
        payment.setRazorpayOrderId(razorpayOrderId);
        payment.setPaymentDate(LocalDateTime.now());

        return paymentRepository.save(payment);
    }

    public String refundPayment(String paymentId) {
        try {
            JSONObject refundRequest = new JSONObject();
            refundRequest.put("amount", paymentRepository.findById(Integer.parseInt(paymentId))
                    .orElseThrow(() -> new RuntimeException("Payment not found"))
                    .getAmount() * 100);

            com.razorpay.Refund refund = getRazorpayClient().refunds.create(refundRequest);
            
            Payment payment = paymentRepository.findById(Integer.parseInt(paymentId))
                    .orElseThrow(() -> new RuntimeException("Payment not found"));
            payment.setStatus("REFUNDED");
            paymentRepository.save(payment);

            return refund.get("id").toString();

        } catch (RazorpayException e) {
            throw new RuntimeException("Refund failed: " + e.getMessage());
        }
    }

    public List<Payment> getPaymentHistory() {
        try {
            return paymentRepository.findAll();
        } catch (Exception e) {
            System.err.println("Error fetching payment history: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public List<PaymentHistoryDto> getPaymentHistoryByUserId(int userId) {
        List<Payment> payments = paymentRepository.findByBookingUserId(userId);

        if (payments.isEmpty()) {
            payments = userRepository.findById(userId)
                    .map(user -> paymentRepository.findByPassengerEmail(user.getEmail()))
                    .orElse(List.of());
        }

        return payments.stream().map(this::toPaymentHistoryDto).toList();
    }

    public double getTotalSpentByUserId(int userId) {
        return getPaymentHistoryByUserId(userId).stream()
                .filter(p -> isSuccessfulPayment(p.getStatus()))
                .mapToDouble(PaymentHistoryDto::getAmount)
                .sum();
    }

    private boolean isSuccessfulPayment(String status) {
        if (status == null) {
            return false;
        }
        String normalized = status.toUpperCase();
        return normalized.equals("SUCCESS") || normalized.equals("COMPLETED");
    }

    private PaymentHistoryDto toPaymentHistoryDto(Payment payment) {
        Booking booking = payment.getBooking();
        String flightNumber = "";
        String source = "";
        String destination = "";

        if (booking != null && booking.getFlight() != null) {
            flightNumber = booking.getFlight().getFlightNumber();
            source = booking.getFlight().getSource();
            destination = booking.getFlight().getDestination();
        }

        String displayId = payment.getPaymentId() != null ? payment.getPaymentId()
                : (payment.getTransactionId() != null ? payment.getTransactionId() : "PAY-" + payment.getId());

        String status = payment.getStatus() != null ? payment.getStatus()
                : (payment.getPaymentStatus() != null ? payment.getPaymentStatus() : "PENDING");

        return new PaymentHistoryDto(
                payment.getId(),
                displayId,
                payment.getAmount(),
                payment.getCurrency() != null ? payment.getCurrency() : "INR",
                status,
                payment.getPaymentDate(),
                booking != null ? booking.getId() : 0,
                flightNumber,
                source,
                destination
        );
    }
}
