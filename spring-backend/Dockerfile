# Multi-stage Dockerfile for Spring Boot backend (Maven build)

FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Leverage cached dependencies
COPY spring-backend/pom.xml ./
RUN mvn -q -e -DskipTests dependency:go-offline

# Build application
COPY spring-backend/ ./
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/*.jar /app/app.jar

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75 -Dserver.port=8081"
EXPOSE 8081

HEALTHCHECK --interval=15s --timeout=5s --retries=5 CMD curl -fsS http://localhost:8081/api/weather/health || exit 1

ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
