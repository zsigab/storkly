plugins {
    id("org.springframework.boot") apply false
    id("io.spring.dependency-management") apply false
    id("com.diffplug.spotless")
}

repositories {
    mavenCentral()
}

spotless {
    // TODO: Java formatting disabled — Spotless 7.0.4 uses com.sun.tools.javac.util.Log$DeferredDiagnosticHandler
    // which was removed in Java 26 (JDK-8316972). Re-enable once Spotless ships a Java 26-compatible release.
    // Both palantirJavaFormat() and googleJavaFormat() fail with NoSuchMethodError on Java 26.
    kotlinGradle {
        target("**/*.gradle.kts")
        ktlint()
    }
}

subprojects {
    apply(plugin = "java-library")

    group = "app.storkly"
    version = "1.0.0-SNAPSHOT"

    repositories {
        mavenCentral()
    }

    configure<JavaPluginExtension> {
        toolchain {
            languageVersion = JavaLanguageVersion.of(26)
        }
    }

    tasks.withType<JavaCompile>().configureEach {
        options.compilerArgs.addAll(listOf("--enable-preview", "-Xlint:preview"))
        options.encoding = "UTF-8"
    }

    tasks.withType<Test>().configureEach {
        useJUnitPlatform()
        jvmArgs("--enable-preview")
    }

    tasks.withType<JavaExec>().configureEach {
        jvmArgs("--enable-preview")
    }
}
