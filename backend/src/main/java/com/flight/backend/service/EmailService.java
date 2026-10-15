package com.flight.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String senderAddress;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username:}") String senderAddress) {
        this.mailSender = mailSender;
        this.senderAddress = senderAddress;
    }

    public void sendVerificationEmail(String to, String token) {
        String subject = "Flight Management System - Email Verification";
        String verificationUrl = "http://localhost:8085/api/auth/verify?token=" + token;
        
        String message = "Dear User,\n\n" +
                "Thank you for registering with Flight Management System.\n\n" +
                "Please click on the below link to verify your email address:\n" +
                verificationUrl + "\n\n" +
                "Alternatively, you can copy and paste this link in your browser:\n" +
                "http://localhost:8085/api/auth/verify?token=" + token + "\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "Best regards,\n" +
                "Flight Management System Team";

        sendEmail(to, subject, message);
    }

    public void sendOtpEmail(String to, String otp) {
        String subject = "Fly High - OTP Verification";
        
        String message = "Dear User,\n\n" +
                "Your One-Time Password (OTP) for Fly High account verification is:\n\n" +
                "OTP: " + otp + "\n\n" +
                "This OTP will expire in 5 minutes.\n\n" +
                "Please enter this OTP on the signup page to complete your registration.\n\n" +
                "If you did not request this OTP, please ignore this email.\n\n" +
                "Best regards,\n" +
                "Fly High Team";

        sendEmail(to, subject, message);
    }

    public void sendBookingConfirmationEmail(String to, String passengerName, String flightNumber, String bookingId) {
        String subject = "Flight Booking Confirmation - " + bookingId;
        
        String message = "Dear " + passengerName + ",\n\n" +
                "Your flight has been successfully booked!\n\n" +
                "Booking Details:\n" +
                "Booking ID: " + bookingId + "\n" +
                "Flight Number: " + flightNumber + "\n" +
                "Status: CONFIRMED\n\n" +
                "Please arrive at the airport at least 2 hours before departure.\n\n" +
                "Best regards,\n" +
                "Flight Management System Team";

        sendEmail(to, subject, message);
    }

    public void sendBookingCancellationEmail(String to, String passengerName, String bookingId, String reason) {
        String subject = "Flight Booking Cancellation - " + bookingId;
        
        String message = "Dear " + passengerName + ",\n\n" +
                "Your flight booking has been cancelled.\n\n" +
                "Booking Details:\n" +
                "Booking ID: " + bookingId + "\n" +
                "Status: CANCELLED\n" +
                "Reason: " + reason + "\n\n" +
                "If you did not request this cancellation, please contact our support team immediately.\n\n" +
                "Best regards,\n" +
                "Flight Management System Team";

        sendEmail(to, subject, message);
    }

    private void sendEmail(String to, String subject, String message) {
        try {
            System.out.println("=== EMAIL SENDING START ===");
            System.out.println("Subject: " + subject);
            
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setTo(to);
            mailMessage.setSubject(subject);
            mailMessage.setText(message);
            if (!senderAddress.isBlank()) {
                mailMessage.setFrom(senderAddress);
            }
            
            System.out.println("Attempting to send email...");
            mailSender.send(mailMessage);
            
            System.out.println("✅ Email sent successfully to: " + to);
            System.out.println("=== EMAIL SENDING COMPLETE ===");
            
        } catch (org.springframework.mail.MailAuthenticationException e) {
            System.err.println("❌ EMAIL AUTHENTICATION FAILED:");
            System.err.println("Error: " + e.getMessage());
            System.err.println("Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "Unknown"));
            System.err.println("SOLUTION: Check Gmail App Password configuration");
            System.err.println("1. Enable 2-Step Verification on Gmail account");
            System.err.println("2. Generate App Password: https://myaccount.google.com/apppasswords");
            System.err.println("3. Update spring.mail.password with the 16-character app password");
            throw new RuntimeException("Email authentication failed. Check Gmail App Password configuration.", e);
            
        } catch (org.springframework.mail.MailSendException e) {
            System.err.println("❌ EMAIL SENDING FAILED:");
            System.err.println("Error: " + e.getMessage());
            System.err.println("Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "Unknown"));
            System.err.println("SOLUTION: Check network connectivity and SMTP settings");
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
            
        } catch (Exception e) {
            System.err.println("❌ UNEXPECTED EMAIL ERROR:");
            System.err.println("Error Type: " + e.getClass().getSimpleName());
            System.err.println("Error Message: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Unexpected email error: " + e.getMessage(), e);
        }
    }
}
