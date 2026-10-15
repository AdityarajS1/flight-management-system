package com.flight.backend.service;

import com.flight.backend.model.User;
import com.flight.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminManagementService {

    private final UserRepository userRepository;

    public AdminManagementService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllAdmins() {
        return userRepository.findByRole(com.flight.backend.model.Role.ADMIN);
    }

    public User createAdmin(User admin) {
        admin.setRole(com.flight.backend.model.Role.ADMIN);
        admin.setVerified(true);
        return userRepository.save(admin);
    }

    public void deleteAdmin(Integer adminId) {
        userRepository.deleteById(adminId);
    }

    public User updateAdmin(Integer adminId, User updatedAdmin) {
        User existingAdmin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        existingAdmin.setName(updatedAdmin.getName());
        existingAdmin.setEmail(updatedAdmin.getEmail());
        if (updatedAdmin.getPassword() != null && !updatedAdmin.getPassword().isEmpty()) {
            existingAdmin.setPassword(updatedAdmin.getPassword());
        }
        return userRepository.save(existingAdmin);
    }

    public User getAdminById(Integer adminId) {
        return userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
    }

    public long getAdminCount() {
        return userRepository.countByRole(com.flight.backend.model.Role.ADMIN);
    }
}
