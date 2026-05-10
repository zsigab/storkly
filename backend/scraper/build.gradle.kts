plugins {
    id("io.spring.dependency-management")
}

dependencyManagement {
    imports {
        mavenBom("org.springframework.boot:spring-boot-dependencies:${libs.versions.springBoot.get()}")
    }
}

dependencies {
    api(project(":domain"))
    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)
    compileOnly(libs.jspecify)
    implementation(libs.springBootStarter)
    implementation(libs.jacksonDatabind)
    implementation(libs.jsoup)
    testImplementation(libs.springBootStarterTest)
}
