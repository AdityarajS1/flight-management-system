package com.flight.backend.service;

import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class OtpService {
    
    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRATION_MINUTES = 5;
    
    public String generateOtp() {
        SecureRandom random = new SecureRandom();
        StringBuilder otp = new StringBuilder();
        
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        
        return otp.toString();
    }
    
    public LocalDateTime getOtpExpirationTime() {
        return LocalDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES);
    }
    
    public boolean isOtpValid(String storedOtp, String providedOtp, LocalDateTime expiresAt) {
        return storedOtp != null && 
               providedOtp != null && 
               storedOtp.equals(providedOtp) && 
               LocalDateTime.now().isBefore(expiresAt);
    }
}
