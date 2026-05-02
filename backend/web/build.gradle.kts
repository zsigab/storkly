plugins {
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

dependencyManagement {
    imports {
        mavenBom("org.springframework.boot:spring-boot-dependencies:${libs.versions.springBoot.get()}")
    }
}

dependencies {
    implementation(project(":service"))
    implementation(project(":scraper"))
    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)
    compileOnly(libs.jspecify)

    // Web
    implementation(libs.springBootStarterWeb)
    implementation(libs.springBootStarterSecurity)
    implementation(libs.springBootStarterOauth2Client)
    implementation(libs.springdocWebmvcUi)
    implementation(libs.springBootStarterMail)
    implementation(libs.springBootStarterValidation)

    // Scraping
    implementation(libs.playwright)

    // Database
    implementation(libs.springBootStarterJooq)
    implementation(libs.springBootStarterFlyway)
    implementation(libs.jooq)
    implementation(libs.flywayCore)
    implementation(libs.flywayPostgres)
    runtimeOnly(libs.postgresql)
    runtimeOnly(libs.bouncycastle)

    // JWT
    implementation(libs.jjwtApi)
    runtimeOnly(libs.jjwtImpl)
    runtimeOnly(libs.jjwtJackson)

    // Testing
    testImplementation(libs.springBootStarterTest)
    testImplementation(libs.springBootTestcontainers)
    testImplementation(libs.testcontainersPostgres)
    testImplementation(libs.testcontainersJunit)
}

// Include domain module's resources (Flyway migrations) directly in BOOT-INF/classes
// so Flyway can find them without nested-jar scanning.
sourceSets.main {
    resources.srcDir(project(":domain").layout.projectDirectory.dir("src/main/resources"))
}

tasks.bootRun {
    environment("SPRING_PROFILES_ACTIVE", System.getenv("SPRING_PROFILES_ACTIVE") ?: "local")
}

tasks.bootJar {
    archiveFileName = "storkly.jar"
}
