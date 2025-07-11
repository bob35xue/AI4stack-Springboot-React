package com.example.chatbot.controller;

import com.example.chatbot.model.Issue;
import com.example.chatbot.model.Product;
import com.example.chatbot.model.User;
import com.example.chatbot.repository.IssueRepository;
import com.example.chatbot.repository.ProductRepository;
import com.example.chatbot.repository.UserRepository;
import com.example.chatbot.service.IssueClassifierService;
import com.example.chatbot.utils.LoggerUtil;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.springframework.web.bind.annotation.*;
import ai.djl.modality.Classifications.Classification;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/issues")
public class IssueController {

    private static final Logger logger = LoggerUtil.getLogger(IssueController.class);
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final IssueClassifierService issueClassifierService;

    public IssueController(IssueRepository issueRepository, UserRepository userRepository, ProductRepository productRepository, IssueClassifierService issueClassifierService) {
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.issueClassifierService = issueClassifierService;
    }

    @PostMapping("/classify")
    public Issue classify(@RequestBody String query, HttpSession session) throws Exception {
        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("User not logged in");
        }
        logger.info("Classifying query for user: {}", userId);
        Classification classification = issueClassifierService.classify(query).best();
        String productName = classification.getClassName();
        double confidence = classification.getProbability();

        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepository.findByName(productName);

        Issue issue = new Issue();
        issue.setQuery(query);
        issue.setUser(user);
        issue.setProductCode(product != null ? product.getId() : 0);
        issue.setProductName(productName);
        issue.setResponse("This appears to be a " + productName + " related issue");
        issue.setCreatedAt(LocalDateTime.now());
        issue.setConfidenceScore(confidence);
        issue.setUnanswered(confidence < 0.6);

        return issueRepository.save(issue);
    }
}