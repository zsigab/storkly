// Pure Java utilities — zero Spring, zero JOOQ, no external runtime deps.
// Imported by all other modules.

dependencies {
    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)
    compileOnly(libs.jspecify)
    testImplementation(libs.springBootStarterTest)
}
