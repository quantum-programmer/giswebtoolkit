<template>
    <gwtk-window-item
        :task-id="taskId"
        :description="description"
        :min-height="376"
        :min-width="380"
        :map-vue="mapVue"
    >
        <v-container v-if="plist">
            {{ errorMessage }}
        </v-container>
        <v-container
            v-else
        >
            <template
                v-if="!selectedFileTree"
            >
                <v-row>
                    <v-col
                        v-for="(project, index) in projectList"
                        :key="index"
                        cols="auto"
                    >
                        <v-tooltip
                            bottom
                        >
                            <template #activator="{ on }">
                                <v-card
                                    width="152"
                                    height="112"
                                    class="rounded-lg"
                                    elevation="0"
                                    v-on="on"
                                >
                                    <v-img
                                        height="100%"
                                        :src="createImageSource(project)"
                                        class="white--text align-end gwtk-project-image"
                                        :class="project.id===activeProjectId? 'gwtk-active-project' : '' "
                                        gradient="rgba(128,128,128,.45), rgba(128,128,128,.05), rgba(128,128,128,.2)"
                                        cover
                                        @click="clickOnProject(project.id)"
                                    >
                                        <div class="white--text text-body-2 image-title project-title">
                                            <span :title="project.text">{{ project.text }}</span>
                                        </div>
                                        <v-btn
                                            color="white"
                                            class="project-content-btn"
                                            icon
                                            @click.stop="clickFileTree(project.id)"
                                        >
                                            <v-icon>
                                                mdi-file-tree
                                            </v-icon>
                                        </v-btn>


                                        <template #placeholder>
                                            <v-row
                                                class="fill-height ma-0"
                                                align="center"
                                                justify="center"
                                            >
                                                <v-progress-circular
                                                    indeterminate
                                                    color="grey lighten-5"
                                                />
                                            </v-row>
                                        </template>
                                    </v-img>
                                </v-card>
                            </template>
                            <div>{{ project.description }}</div>
                        </v-tooltip>
                    </v-col>
                </v-row>
            </template>
            <template
                v-else-if="selectedProject"
            >
                <div class="text-subtitle-1 font-weight-bold project-title">
                    <span :title="selectedProject.text">{{ selectedProject.text }}</span>
                </div>
                <div class="text-subtitle-2">
                    {{ selectedProject.description }}
                </div>
                <v-treeview
                    open-on-click
                    :items="itemsTree"
                    item-text="text"
                    item-children="nodes"
                    class="tree-view"
                >
                    <template #prepend="{ item, open }">
                        <v-icon v-if="item.nodes">
                            {{ open ? 'mdi-folder-open-outline' : 'mdi-folder-outline' }}
                        </v-icon>
                        <v-icon v-else>
                            {{ 'mdi-map' }}
                        </v-icon>
                    </template>
                </v-treeview>
                <v-row
                    class="mt-2 pt-2"
                    justify="space-between"
                    align-content="center"
                >
                    <v-col
                        cols="auto"
                        class="ml-2"
                    >
                        <v-btn
                            color="primary"
                            outlined
                            @click="clickOnBack"
                        >
                            {{ $t('phrases.Cancel') }}
                        </v-btn>
                    </v-col>
                    <v-col
                        cols="auto"
                        class="mr-2"
                    >
                        <v-btn
                            color="primary"
                            @click="clickOnSelectButton"
                        >
                            {{ $t('projects.Open project') }}
                        </v-btn>
                    </v-col>
                </v-row>
            </template>
        </v-container>
    </gwtk-window-item>
</template>

<script src="./GwtkProjectsWidget.ts" />

<style scoped>

    .image-title {
        height: 112px;
        padding: 4px;
    }

    .project-title {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .project-content-btn {
        position: absolute;
        right: 0;
        bottom: 0;
    }

    .tree-view {
        height: calc(100% - 80px);
        overflow: auto;
    }

    .gwtk-project-image {
        cursor: pointer;
        opacity: 0.75;
    }

    .gwtk-project-image:hover {
        opacity: 1;
    }

    .gwtk-active-project {
        box-shadow: var(--shadow-grey);
        border: solid .2em var(--v-primary-base);
        opacity: 1;
    }
</style>
