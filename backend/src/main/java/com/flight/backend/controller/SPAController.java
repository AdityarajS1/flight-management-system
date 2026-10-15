package com.flight.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SPAController {

    @GetMapping(value = {
            "/",
            "/login",
            "/signup",
            "/email-verification",
            "/dashboard",
            "/flights",
            "/search",
            "/profile",
            "/payment-history",
            "/payment",
            "/booking/**",
            "/admin"
    })
    public String index() {
        return "forward:/index.html";
    }
}
