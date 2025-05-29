<template>
    <div v-if="!exportOverlay">
        <v-row class="justify-space-around pa-4 gwtk-user-thematic-project-buttons">
            <v-col>
                <gwtk-menu
                    :title="$t('userthematic.Project')"
                    icon="mdi-plus"
                    is-dropdown
                    width-available
                >
                    <v-list>
                        <gwtk-list-item
                            icon="mdi-file-plus-outline"
                            icon-size="23"
                            :title="$t('userthematic.Create')"
                            @click="toggleCreate()"
                        />
                        <gwtk-list-item
                            icon="mdi-folder-open-outline"
                            icon-size="23"
                            :title="$t('userthematic.Open')"
                            @click="toggleAddProjectFromFile()"
                        />
                    </v-list>
                </gwtk-menu>
            </v-col>
            <v-col>
                <gwtk-button
                    secondary
                    :title="$t('userthematic.Export') + '...'"
                    width-available
                    :disabled="!projectNamesList.length"
                    @click="toggleExportDots()"
                />
            </v-col>
        </v-row>
        <v-row class="pl-4 pr-2 mr-0">
            <v-list class="gwtk-user-thematic-project-list">
                <gwtk-list-item
                    v-for="(item, index) in projectNamesList"
                    :key="index"
                    :title="item"
                    :class="index===projectClickedIndex? 'selected pl-4':'pl-4'"
                    :input-value="index===projectSelectedIndex"
                    @click="setProjectSelectedIndex(index)"
                >
                    <template #right-slot>
                        <gwtk-icon-button
                            icon="pencil"
                            icon-size="18"
                            @click="toggleEditProject(index)"
                        />
                        <gwtk-icon-button
                            icon="close-icon"
                            icon-size="18"
                            :disabled="projectNamesList.length===1"
                            @click="toggleRemoveProject(index)"
                        />
                    </template>
                </gwtk-list-item>
            </v-list>
        </v-row>
        <v-row class="pa-4 justify-space-around">
            <v-col>
                <gwtk-button
                    primary
                    width-available
                    :title="$t('userthematic.Select')"
                    :disabled="!selectEnabled"
                    @click="toggleSelectProject"
                />
            </v-col>
            <v-col>
                <gwtk-button
                    secondary
                    width-available
                    :title="$t('userthematic.Cancel')"
                    @click="$emit('goBack')"
                />
            </v-col>
        </v-row>
    </div>
    <div v-else>
        <v-row class="px-8 justify-start">
            <v-col>
                <gwtk-checkbox
                    v-model="selectAllValue"
                    :label="$t('userthematic.Select') + ' ' + $t('userthematic.All').toLowerCase()"
                />
            </v-col>
        </v-row>
        <v-divider class="mt-3 mx-6" />
        <v-row class="mx-0 justify-start px-4 py-3">
            <v-list class="gwtk-user-thematic-export-project-list">
                <gwtk-list-item
                    v-for="(item, index) in projectNamesList"
                    :key="index"
                    style="width: 280px"
                >
                    <gwtk-checkbox
                        v-model="projectSelectedList[index]"
                        :label="item"
                    />
                </gwtk-list-item>
            </v-list>
        </v-row>
        <v-row class="px-4 mx-0">
            <v-text-field
                v-model="projectListNameDefault"
                outlined
                dense
                hide-details
                required
                counter
                maxlength="255"
                clearable
                :label="$t('userthematic.File name')"
            />
        </v-row>
        <v-row class="pa-4">
            <v-col>
                <gwtk-button
                    primary
                    width-available
                    :title="$t('userthematic.Export')"
                    :disabled="!exportEnabled"
                    @click="toggleExport()"
                />
            </v-col>
            <v-col>
                <gwtk-button
                    secondary
                    width-available
                    :title="$t('userthematic.Cancel')"
                    @click="exportOverlay = false"
                />
            </v-col>
        </v-row>
    </div>
</template>

<script src="./GwtkUserThematicProjectManager.ts" type="ts" />

<style scoped>

    .selected {
        background-color: var(--v-secondary-lighten4);
    }

    .gwtk-user-thematic-project-list {
        width: 100%;
    }

    .gwtk-user-thematic-export-project-list {
        overflow-y: auto;
        overflow-x: hidden;
        max-height: 23.5vh
    }
    .gwtk-user-thematic-project-list .v-list-item {
        min-height: var(--list-item-min-height-dense);
    }
    .gwtk-user-thematic-project-list ::v-deep .v-list-item__content {
        padding-top: 0;
        padding-bottom: 0;
    }
    .gwtk-user-thematic-export-project-list ::v-deep .v-list-item {
        min-height: var(--list-item-min-height-dense);
    }
    .gwtk-user-thematic-export-project-list ::v-deep .v-list-item__content {
        padding-top: var(--list-item-dense-padding-top);
        padding-bottom: var(--list-item-dense-padding-bottom);
    }
    .gwtk-user-thematic-project-buttons ::v-deep .v-btn:not(.v-btn--round).v-size--default{
        height: var(--v-btn-height--default);
        padding-right: var(--px-2) !important;
        padding-left: var(--px-2) !important;
        padding-top: var(--py-2) !important;
        padding-bottom: var(--py-2) !important;
    }
</style>