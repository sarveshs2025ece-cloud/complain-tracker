package com.example.complaintbox.service;

import com.example.complaintbox.entity.Category;
import com.example.complaintbox.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {
    private final CategoryRepository repository;

    public CategoryService(CategoryRepository repository) {
        this.repository = repository;
    }

    public Category add(Category data) {
        return repository.save(data);
    }

    public List<Category> getAll() {
        return repository.findAll();
    }

    public Category getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Category update(Long id, Category data) {
        Category existing = repository.findById(id).orElse(null);
        if (existing == null) {
            return null;
        }
        existing.setName(data.getName());
        existing.setDescription(data.getDescription());
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<Category> search(String keyword) {
        return repository.findByNameContainingIgnoreCase(keyword);
    }
}
