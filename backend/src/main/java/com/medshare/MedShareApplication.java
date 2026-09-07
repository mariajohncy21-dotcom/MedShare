package com.medshare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MedShareApplication {
    public static void main(String[] args) {
        SpringApplication.run(MedShareApplication.class, args);
        System.out.println("MedShare Emergency Medicine & Smart Allocation Network Running on port 8080");
    }
}
