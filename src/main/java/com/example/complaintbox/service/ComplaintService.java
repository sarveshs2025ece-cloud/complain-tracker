package com.example.complaintbox.service;

import com.example.complaintbox.entity.Complaint;
import com.example.complaintbox.repository.ComplaintRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ComplaintService {
    private final ComplaintRepository repository;

    public ComplaintService(ComplaintRepository repository) {
        this.repository = repository;
    }

    public Complaint add(Complaint data) {
        if (data.getStatus() == null || data.getStatus().isBlank()) {
            data.setStatus("OPEN");
        } else {
            data.setStatus(data.getStatus().toUpperCase());
        }
        LocalDateTime now = LocalDateTime.now();
        data.setCreatedAt(now);
        data.setUpdatedAt(now);
        if ("RESOLVED".equalsIgnoreCase(data.getStatus())) {
            data.setResolvedAt(now);
        }
        return repository.save(data);
    }

    public List<Complaint> getAll() {
        return repository.findAll();
    }

    public Complaint getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Complaint update(Long id, Complaint data) {
        Complaint existing = repository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }

        String oldStatus = existing.getStatus() != null ? existing.getStatus().toUpperCase() : "OPEN";
        String newStatus = data.getStatus() != null ? data.getStatus().toUpperCase() : oldStatus;

        // Business rule: status progression OPEN (1) -> IN_PROGRESS (2) -> RESOLVED (3)
        // Moving backward requires a remark
        int oldRank = getStatusRank(oldStatus);
        int newRank = getStatusRank(newStatus);
        if (newRank < oldRank) {
            if (data.getRemark() == null || data.getRemark().trim().isEmpty()) {
                throw new IllegalArgumentException("Remark is required when moving complaint status backward");
            }
        }

        existing.setResidentId(data.getResidentId());
        existing.setStaffId(data.getStaffId());
        existing.setCategoryId(data.getCategoryId());
        existing.setRoomNumber(data.getRoomNumber());
        existing.setDescription(data.getDescription());
        existing.setStatus(newStatus);
        existing.setRemark(data.getRemark());
        existing.setUpdatedAt(LocalDateTime.now());

        if ("RESOLVED".equalsIgnoreCase(newStatus)) {
            if (existing.getResolvedAt() == null) {
                existing.setResolvedAt(LocalDateTime.now());
            }
        } else {
            existing.setResolvedAt(null);
        }

        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<Complaint> search(String keyword) {
        return repository.findByDescriptionContainingIgnoreCase(keyword);
    }

    public List<Complaint> getByResidentId(Long residentId) {
        return repository.findByResidentId(residentId);
    }

    public List<Complaint> getByStatus(String status) {
        return repository.findByStatus(status.toUpperCase());
    }

    private int getStatusRank(String status) {
        return switch (status) {
            case "OPEN" -> 1;
            case "IN_PROGRESS" -> 2;
            case "RESOLVED" -> 3;
            default -> 0;
        };
    }
}
