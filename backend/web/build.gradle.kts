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
    implementation(libs.springBootStarterMail)
    implementation(libs.springBootStarterValidation)

    // Database
    implementation(libs.jooq)
    implementation(libs.flywayCore)
    implementation(libs.flywayPostgres)
    runtimeOnly(libs.postgresql)

    // Testing
    testImplementation(libs.springBootStarterTest)
    testImplementation(libs.springBootTestcontainers)
    testImplementation(libs.testcontainersPostgres)
    testImplementation(libs.testcontainersJunit)
}
