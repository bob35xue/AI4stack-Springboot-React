package com.example.chatbot.controller;

import com.example.chatbot.model.User;
import com.example.chatbot.repository.UserRepository;
import com.example.chatbot.utils.LoggerUtil;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private static final Logger logger = LoggerUtil.getLogger(UserController.class);
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    @PostMapping("/login")
    public User login(@RequestBody User user, HttpSession session) {
        User dbUser = userRepository.findByEmail(user.getEmail());
        if (dbUser != null && dbUser.getPassword().equals(user.getPassword())) {
            session.setAttribute("userId", dbUser.getId());
            logger.info("User {} logged in successfully", dbUser.getEmail());
            return dbUser;
        }
        logger.warn("Failed login attempt for user {}", user.getEmail());
        return null;
    }
}
