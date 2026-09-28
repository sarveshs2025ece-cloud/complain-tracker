package com.example.complaintbox.service;

import com.example.complaintbox.entity.Resident;
import com.example.complaintbox.repository.ResidentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ResidentService {
    private final ResidentRepository repository;

    public ResidentService(ResidentRepository repository) {
        this.repository = repository;
    }

    public Resident add(Resident data) {
        return repository.save(data);
    }

    public List<Resident> getAll() {
        return repository.findAll();
    }

    public Resident getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Resident update(Long id, Resident data) {
        Resident existing = repository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }
        existing.setName(data.getName());
        existing.setEmail(data.getEmail());
        existing.setRoomNumber(data.getRoomNumber());
        existing.setPhone(data.getPhone());
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<Resident> search(String keyword) {
        return repository.findByNameContainingIgnoreCase(keyword);
    }
}
