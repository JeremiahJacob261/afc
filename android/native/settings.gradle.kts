pluginManagement {
    repositories {
        google { content { excludeGroupByRegex("org\\.jetbrains.*") } }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        providers.gradleProperty("uclDependencyRepository").orNull?.let { repositoryPath ->
            maven {
                name = "verifiedLocalBuildDependencies"
                url = uri(repositoryPath)
                content {
                    includeModule("org.jetbrains.kotlin", "compose-group-mapping")
                    includeModule("org.jetbrains.kotlin", "kotlin-stdlib")
                    includeGroup("org.ow2.asm")
                    includeModule("org.ow2", "ow2")
                }
            }
        }
        google { content { excludeGroupByRegex("org\\.jetbrains.*") } }
        mavenCentral()
    }
}

rootProject.name = "ucl-native"
include(":app")
