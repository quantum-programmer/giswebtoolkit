<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :description="description"
        :map-vue="mapVue"
        :title-background-color="$vuetify.breakpoint.xs? 'var(--color-violet-dark-02)':undefined"
        :title-text-color="$vuetify.breakpoint.xs?'var(--color-white)':undefined"
    >
        <v-container
            class="pa-0"
            :style="showPanelStyle ? 'display:none;':'display:block;'"
            style="height: 100%"
        >
            <v-sheet outlined rounded class="pa-2" style="height: 97%;">
                <v-row class="ma-1" dense>
                    <v-col class="pa-1 text-center">
                        {{ $t('beekeeper.List of permanent apiaries') }}
                    </v-col>
                </v-row>
                <v-divider />
                <v-row style="height: 94%">
                    <v-col style="height: 100%">
                        <gwtk-beekeeper-static-records-list-widget
                            :set-state="setState"
                            :map-vue="mapVue"
                            :records-list="recordsList"
                            :selected-object-from-db="selectedObjectFromDB"
                            :update-overlay="showMapObjectsUpdateOverlay"
                        />
                    </v-col>
                </v-row>
            </v-sheet>
            <v-overlay
                :value="showMapObjectsUpdateOverlay"
                absolute
                z-index="100"
            >
                <v-row no-gutters dense align="center" justify="center">
                    <v-progress-circular active indeterminate size="64" />
                </v-row>
            </v-overlay>
        </v-container>
        <v-container
            class="pa-0"
            :style="showPanelStyle ? 'display:block;':'display:none;'"
            style="min-height: 300px"
        >
            <gwtk-beekeeper-static-record-edit-form
                :set-state="setState"
                :map-vue="mapVue"
                :record="currentMapObjectDataFromDB"
                :show-save-overlay="showSaveOverlay"
            />
        </v-container>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkBeekeeperStaticWidget.ts" />

<style scoped>

</style>