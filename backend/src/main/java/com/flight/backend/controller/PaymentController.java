package com.flight.backend.controller;

import com.flight.backend.model.Payment;
import com.flight.backend.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> request) {
        try {
            double amount = Double.parseDouble(request.get("amount").toString());
            String currency = request.getOrDefault("currency", "INR").toString();
            String receipt = request.getOrDefault("receipt", "receipt_" + System.currentTimeMillis()).toString();

            Map<String, Object> order = paymentService.createOrder(amount, currency, receipt);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "order", order
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> request) {
        try {
            String razorpayOrderId = request.get("razorpayOrderId");
            String razorpayPaymentId = request.get("razorpayPaymentId");
            String razorpaySignature = request.get("razorpaySignature");

            Payment payment = paymentService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Payment verified successfully",
                "payment", payment
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/refund/{paymentId}")
    public ResponseEntity<?> refundPayment(@PathVariable int paymentId) {
        try {
            String refundId = paymentService.refundPayment(String.valueOf(paymentId));
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Refund initiated successfully",
                "refundId", refundId
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getPaymentHistory() {
        try {
            List<Payment> payments = paymentService.getPaymentHistory();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "payments", payments
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getPaymentsByUserId(@PathVariable int userId) {
        try {
            return ResponseEntity.ok(paymentService.getPaymentHistoryByUserId(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/user/{userId}/total-spent")
    public ResponseEntity<?> getTotalSpentByUserId(@PathVariable int userId) {
        try {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "totalSpent", paymentService.getTotalSpentByUserId(userId)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
