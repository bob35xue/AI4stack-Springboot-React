package com.example.chatbot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ChatbotApplication {

    public static void main(String[] args) {
        System.out.println("Starting ChatbotApplication...");
        org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(ChatbotApplication.class);
        logger.info("ChatbotApplication main started");
        SpringApplication.run(ChatbotApplication.class, args);
    }

}