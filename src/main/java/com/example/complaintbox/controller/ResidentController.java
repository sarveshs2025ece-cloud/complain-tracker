package com.example.complaintbox.controller;

import com.example.complaintbox.entity.Resident;
import com.example.complaintbox.service.ResidentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/residents")
public class ResidentController {

    private final ResidentService service;

    public ResidentController(ResidentService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Resident> add(@Valid @RequestBody Resident data) {
        Resident created = service.add(data);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<Resident> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resident> getById(@PathVariable Long id) {
        Resident item = service.getById(id);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(item);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Resident> update(@PathVariable Long id, @Valid @RequestBody Resident data) {
        Resident updated = service.update(id, data);
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
    public List<Resident> search(@RequestParam(defaultValue = "") String keyword) {
        return service.search(keyword);
    }
}
