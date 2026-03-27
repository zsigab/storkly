// Domain layer: entities, repository interfaces, enums, domain exceptions.
// JOOQ generated classes live here (codegen added in Phase 1C with Flyway scripts).

dependencies {
    api(project(":util"))
    api(libs.jooq)
    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)
    compileOnly(libs.jspecify)
    testImplementation(libs.springBootStarterTest)
}
