package com.flight.backend.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public final class FlightDateTimeUtil {

    private static final DateTimeFormatter[] FORMATTERS = {
            DateTimeFormatter.ISO_LOCAL_DATE_TIME,
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")
    };

    private FlightDateTimeUtil() {
    }

    public static LocalDateTime parseDepartureTime(String departureTime) {
        if (departureTime == null || departureTime.isBlank()) {
            throw new IllegalArgumentException("Departure time cannot be empty");
        }

        String normalized = departureTime.trim().replace(' ', 'T');
        if (normalized.length() == 16) {
            normalized = normalized + ":00";
        }

        for (DateTimeFormatter formatter : FORMATTERS) {
            try {
                return LocalDateTime.parse(normalized, formatter);
            } catch (DateTimeParseException ignored) {
                // try next format
            }
        }

        throw new IllegalArgumentException("Invalid departure time format: " + departureTime);
    }

    public static boolean isUpcoming(String departureTime) {
        return parseDepartureTime(departureTime).isAfter(LocalDateTime.now());
    }

    /** Customer may cancel only until 24 hours before scheduled departure. */
    public static boolean canCustomerCancel(String departureTime) {
        LocalDateTime cutoff = parseDepartureTime(departureTime).minusHours(24);
        return LocalDateTime.now().isBefore(cutoff);
    }

    public static boolean matchesDateTimeFilter(String departureTime, String departureDate, String departureTimeFilter) {
        LocalDateTime flightDeparture = parseDepartureTime(departureTime);
        boolean hasDate = departureDate != null && !departureDate.isBlank();
        boolean hasTime = departureTimeFilter != null && !departureTimeFilter.isBlank();

        if (!hasDate && !hasTime) {
            return true;
        }

        if (hasDate) {
            LocalDate filterDate = LocalDate.parse(departureDate.trim());
            if (!flightDeparture.toLocalDate().equals(filterDate)) {
                return false;
            }

            if (hasTime) {
                LocalTime filterTime = parseTimeFilter(departureTimeFilter);
                LocalDateTime filterDateTime = LocalDateTime.of(filterDate, filterTime);
                return !flightDeparture.isBefore(filterDateTime);
            }
            return true;
        }

        LocalTime filterTime = parseTimeFilter(departureTimeFilter);
        return !flightDeparture.toLocalTime().isBefore(filterTime);
    }

    private static LocalTime parseTimeFilter(String departureTimeFilter) {
        String value = departureTimeFilter.trim();
        if (value.length() == 5) {
            return LocalTime.parse(value);
        }
        return LocalTime.parse(value, DateTimeFormatter.ofPattern("HH:mm:ss"));
    }
}
