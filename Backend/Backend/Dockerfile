# Stage 1: Build Stage
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy project files
COPY . .

# Grant execute permission on Maven Wrapper and compile the executable JAR
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

# Stage 2: Production Runtime Stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Create a dedicated directory for persistent SQLite storage
RUN mkdir -p /app/data

# Copy only the compiled JAR from the builder stage
COPY --from=builder /app/target/Backend-0.0.1-SNAPSHOT.jar app.jar

# Set deployment environment variables
ENV PORT=8080
ENV SQLITE_DB_PATH=/app/data/skillsort.db

# Configure default JVM options to fit in Render Free Tier (512MB RAM)
ENV JAVA_OPTS="-Xmx350m"

EXPOSE 8080

# Execute with dynamic JVM parameters
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]