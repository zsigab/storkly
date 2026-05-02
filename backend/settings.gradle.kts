pluginManagement {
    repositories {
        maven { url = uri("https://repo.spring.io/milestone") }
        gradlePluginPortal()
        mavenCentral()
    }
    plugins {
        id("org.springframework.boot") version "4.1.0-M4"
        id("io.spring.dependency-management") version "1.1.7"
        id("com.diffplug.spotless") version "7.0.4"
        id("org.jooq.jooq-codegen-gradle") version "3.21.1"
    }
}

dependencyResolutionManagement {
    repositories {
        maven { url = uri("https://repo.spring.io/milestone") }
        mavenCentral()
    }
}

rootProject.name = "storkly-backend"

include("util", "domain", "service", "scraper", "web")
