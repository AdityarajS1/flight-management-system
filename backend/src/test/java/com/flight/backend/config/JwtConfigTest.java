package com.flight.backend.config;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtConfigTest {

    private static Validator validator;
    private static AutoCloseable validatorFactory;

    @BeforeAll
    static void createValidator() {
        var factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
        validatorFactory = factory::close;
    }

    @AfterAll
    static void closeValidator() throws Exception {
        validatorFactory.close();
    }

    @Test
    void rejectsMissingOrShortSigningSecret() {
        JwtConfig config = new JwtConfig();

        assertFalse(validator.validate(config).isEmpty());

        config.setSecret("too-short");
        assertFalse(validator.validate(config).isEmpty());
    }

    @Test
    void acceptsSigningSecretWithAtLeastThirtyTwoCharacters() {
        JwtConfig config = new JwtConfig();
        config.setSecret("a-random-secret-with-at-least-32-characters");

        assertTrue(validator.validate(config).isEmpty());
    }
}
