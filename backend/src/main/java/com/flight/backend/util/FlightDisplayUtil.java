package com.flight.backend.util;

import com.flight.backend.model.Flight;
import com.flight.backend.model.FlightStatus;

public final class FlightDisplayUtil {

    private FlightDisplayUtil() {
    }

    public static String resolveDisplayStatus(Flight flight) {
        if (!FlightDateTimeUtil.isUpcoming(flight.getDepartureTime())) {
            return "DEPARTED";
        }
        if (flight.getStatus() == FlightStatus.CANCELLED) {
            return "CANCELLED";
        }
        return "SCHEDULED";
    }

    public static boolean isBookable(Flight flight) {
        return "SCHEDULED".equals(resolveDisplayStatus(flight)) && flight.getSeatsAvailable() > 0;
    }
}
