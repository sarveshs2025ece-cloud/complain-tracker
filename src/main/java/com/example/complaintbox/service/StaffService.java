package com.example.complaintbox.service;

import com.example.complaintbox.entity.Staff;
import com.example.complaintbox.repository.StaffRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StaffService {
    private final StaffRepository repository;

    public StaffService(StaffRepository repository) {
        this.repository = repository;
    }

    public Staff add(Staff data) {
        return repository.save(data);
    }

    public List<Staff> getAll() {
        return repository.findAll();
    }

    public Staff getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Staff update(Long id, Staff data) {
        Staff existing = repository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }
        existing.setName(data.getName());
        existing.setEmail(data.getEmail());
        existing.setRole(data.getRole());
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<Staff> search(String keyword) {
        return repository.findByNameContainingIgnoreCase(keyword);
    }
}
