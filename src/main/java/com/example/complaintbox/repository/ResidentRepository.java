package com.example.complaintbox.repository;

import com.example.complaintbox.entity.Resident;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResidentRepository extends JpaRepository<Resident, Long> {
    List<Resident> findByNameContainingIgnoreCase(String keyword);
}
