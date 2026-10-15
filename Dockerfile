FROM eclipse-temurin:17-jre

WORKDIR /app
COPY backend/target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8085

USER 10001:10001

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
