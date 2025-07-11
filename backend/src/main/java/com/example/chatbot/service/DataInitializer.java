package com.example.chatbot.service;

import com.example.chatbot.model.Product;
import com.example.chatbot.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.List;

@Component
public class DataInitializer {

    @Autowired
    private ProductRepository productRepository;

    @PostConstruct
    public void init() {
        List<String> productNames = List.of(
            "Printer", "Scanner", "Laptop", "Monitor", "Keyboard",
            "Mouse", "Projector", "Fax machine", "Calculator", "Shredder",
            "Photocopier", "Whiteboard", "Paper shredder", "Desk lamp",
            "External hard drive", "Conference phone", "Label maker",
            "Document camera", "Wireless presenter", "USB hub"
        );

        for (String productName : productNames) {
            if (productRepository.findByName(productName) == null) {
                Product product = new Product();
                product.setName(productName);
                productRepository.save(product);
            }
        }
    }
}