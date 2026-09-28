package com.example.complaintbox.repository;

import com.example.complaintbox.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByDescriptionContainingIgnoreCase(String keyword);
    List<Complaint> findByResidentId(Long residentId);
    List<Complaint> findByStatus(String status);
    List<Complaint> findByStaffId(Long staffId);
    List<Complaint> findByCategoryId(Long categoryId);
}
