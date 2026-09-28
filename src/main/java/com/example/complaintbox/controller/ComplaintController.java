package com.example.complaintbox.controller;

import com.example.complaintbox.entity.Complaint;
import com.example.complaintbox.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService service;

    public ComplaintController(ComplaintService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Complaint> add(@Valid @RequestBody Complaint data) {
        Complaint created = service.add(data);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<Complaint> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Complaint> getById(@PathVariable Long id) {
        Complaint item = service.getById(id);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(item);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Complaint> update(@PathVariable Long id, @Valid @RequestBody Complaint data) {
        Complaint updated = service.update(id, data);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public List<Complaint> search(@RequestParam(defaultValue = "") String keyword) {
        return service.search(keyword);
    }

    @GetMapping("/resident/{residentId}")
    public List<Complaint> getByResident(@PathVariable Long residentId) {
        return service.getByResidentId(residentId);
    }

    @GetMapping("/status/{status}")
    public List<Complaint> getByStatus(@PathVariable String status) {
        return service.getByStatus(status);
    }
}
