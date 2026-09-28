package com.example.complaintbox.repository;

import com.example.complaintbox.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StaffRepository extends JpaRepository<Staff, Long> {
    List<Staff> findByNameContainingIgnoreCase(String keyword);
}
