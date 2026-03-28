// Domain layer: entities, repository interfaces, enums, domain exceptions.
// JOOQ generated classes live here (DDL-based codegen from Flyway scripts).

plugins {
    alias(libs.plugins.jooqCodegen)
}

sourceSets {
    main {
        java {
            srcDir("build/generated-sources/jooq")
        }
    }
}

tasks.named("compileJava") {
    dependsOn("jooqCodegen")
}

dependencies {
    api(project(":util"))
    api(libs.jooq)
    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)
    compileOnly(libs.jspecify)
    testImplementation(libs.springBootStarterTest)

    jooqCodegen(libs.jooqMetaExtensions)
}

jooq {
    configuration {
        generator {
            database {
                name = "org.jooq.meta.extensions.ddl.DDLDatabase"
                properties {
                    property {
                        key = "scripts"
                        value = "src/main/resources/db/migration/*.sql"
                    }
                    property {
                        key = "sort"
                        value = "flyway"
                    }
                    property {
                        key = "defaultNameCase"
                        value = "lower"
                    }
                    property {
                        key = "parseDialect"
                        value = "POSTGRES"
                    }
                }
            }
            target {
                packageName = "app.storkly.domain.generated"
                directory = "build/generated-sources/jooq"
            }
            generate {
                isRecords = true
                isPojos = false
                isDaos = false
                isFluentSetters = false
            }
        }
    }
}
