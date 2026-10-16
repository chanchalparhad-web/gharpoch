# syntax=docker/dockerfile:1
# Multi-stage build for Spring Boot 3 / Java 17

# Stage 1: Cache dependencies and build the application
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy pom.xml and pre-fetch dependencies (layer caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Lightweight runtime environment
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create a non-root system user for security
RUN addgroup -S gharpoch && adduser -S gharpoch -G gharpoch
USER gharpoch

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Cloud providers (Render, Railway, Heroku) inject the PORT environment variable dynamically
EXPOSE 8080
ENV PORT=8080

# Run Spring Boot and bind to cloud-assigned PORT
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT:-8080} -jar app.jar"]
