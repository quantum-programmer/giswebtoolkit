<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :description="description"
        :options="{title:$t('floodzone.Build flood zone')}"
        :map-vue="mapVue"
        min-height="500"
    >
        <div v-if="isComponentConfigured" class="gwtk-flood-main">
            <div class="gwtk-flood-panel">
                <div v-if="!isObjectSelected && !isNewBuilding">
                    <div class="pa-4">
                        {{ $t('phrases.Select map object') }}
                    </div>
                    <div v-if="objectName" class="px-4">
                        {{ $t('floodzone.Current object') + objectName }}
                    </div>
                </div>
                <div v-else-if="!allPointsAreSelected">
                    <div class="pa-4">
                        {{ $t('floodzone.Select') + ' ' + maxPointsCount + ' ' + $t('floodzone.object points')
                        }}
                    </div>
                    <div v-if="additionalMessage" class="px-4">
                        {{ $t('floodzone.Current object') + ': ' + additionalMessage }}
                    </div>
                </div>
                <div
                    v-if="objectPointsArray.length && objectPointsArray.length === maxPointsCount"
                    class="px-4 gwtk-flood-param"
                >
                    {{ $t('floodzone.Elevation matrix') }}
                    <v-select
                        :items="matrixList"
                        :value="selectedMatrixId"
                        item-value="id"
                        item-text="name"
                        class="pb-4"
                        dense
                        flat
                        outlined
                        hide-details
                        @change="changeMatrix"
                    />
                    {{ $t('floodzone.Maximum zone width (m)') }}
                    <v-text-field
                        v-model="floodWidth"
                        :rules="numberRule"
                        number
                        required
                        clearable
                        dense
                        :counter="8"
                        @change="floodWidth? floodWidth : ''"
                    />
                    {{ $t('floodzone.Point coordinates') }}
                    <v-row class="pt-4">
                        <div class="text-center gwtk-flood-coord-header">
                            X
                        </div>
                        <div class="text-center gwtk-flood-coord-header">
                            Y
                        </div>
                        <div class="text-center gwtk-flood-coord-header">
                            H
                        </div>
                    </v-row>
                    <v-row class="mt-0">
                        <v-col cols="4">
                            <v-text-field
                                :value="firstPointX"
                                readonly
                                required
                                outlined
                                dense
                                hide-details
                            />
                        </v-col>
                        <v-col cols="4">
                            <v-text-field
                                :value="firstPointY"
                                readonly
                                required
                                outlined
                                dense
                                hide-details
                            />
                        </v-col>
                        <v-col cols="4">
                            <v-text-field
                                :value="firstPointElevation"
                                readonly
                                outlined
                                dense
                                hide-details
                            />
                        </v-col>
                    </v-row>
                    <v-row class="pb-4">
                        <v-col cols="4">
                            <v-text-field
                                :value="secondPointX"
                                readonly
                                required
                                number
                                outlined
                                dense
                                hide-details
                            />
                        </v-col>
                        <v-col cols="4">
                            <v-text-field
                                :value="secondPointY"
                                readonly
                                required
                                number
                                outlined
                                dense
                                hide-details
                            />
                        </v-col>
                        <v-col cols="4">
                            <v-text-field
                                :value="secondPointElevation"
                                readonly
                                outlined
                                dense
                                hide-details
                            />
                        </v-col>
                    </v-row>
                    {{ $t('floodzone.Lift level (m)') }}
                    <v-row class="mt-0 pb-1">
                        <v-col cols="6">
                            <v-text-field
                                v-model="levelFirst"
                                :rules="numberRule"
                                :counter="4"
                                :label="$t('floodzone.First point')"
                                number
                                autofocus
                                required
                                outlined
                                dense
                                @change="levelFirst? levelFirst : ''"
                            />
                        </v-col>
                        <v-col cols="6">
                            <v-text-field
                                v-model="levelSecond"
                                :rules="numberRule"
                                :counter="4"
                                :label="$t('floodzone.Second point')"
                                number
                                required
                                outlined
                                dense
                                @change="levelSecond? levelSecond : ''"
                            />
                        </v-col>
                    </v-row>
                    <v-divider class="pt-4" />
                    {{ $t('floodzone.Virtual folder') }}
                    <v-select
                        :items="folderList"
                        :value="selectedFolderId"
                        item-value="id"
                        item-text="name"
                        class="pb-4"
                        dense
                        outlined
                        hide-details
                        @change="changeFolder"
                    />
                    {{ $t('floodzone.Flood zone name') }}
                    <v-text-field
                        v-model="floodName"
                        :rules="namesRule"
                        class="pb-4"
                        required
                        clearable
                        dense
                        :counter="256"
                        @change="floodName? floodName : ''"
                    />
                </div>
            </div>
            <v-row v-if="!isNewBuilding" class="px-4 justify-space-around">
                <gwtk-button
                    primary
                    :disabled="!dataReady"
                    :title="$t( 'phrases.Build' )"
                    width="47%"
                    @click="buildStart"
                />
                <gwtk-button
                    class="mb-4"
                    secondary
                    :disabled="!isObjectSelected"
                    :title="$t( 'floodzone.Reset' )"
                    width="47%"
                    @click="resetSelection"
                />
            </v-row>
            <v-row v-else class="px-4">
                <gwtk-button
                    secondary
                    :title="$t( 'floodzone.New building' )"
                    width-available
                    @click="newBuilding"
                />
            </v-row>
            <v-overlay :value="isBuilding">
                <v-progress-circular
                    indeterminate
                    size="64"
                />
            </v-overlay>
        </div>
        <v-sheet v-else class="mx-2">
            {{ $t('floodzone.Component not configured') }}
        </v-sheet>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkBuildFloodZoneWidget.ts"></script>

<style scoped>
    .gwtk-flood-main {
        height: 100%;
    }

    .gwtk-flood-panel {
        height: calc(100% - 2.3em);
    }

    .gwtk-flood-param {
        height: calc(100% - 1em);
        overflow-y: auto;
        overflow-x: hidden;
    }

    .gwtk-flood-coord-header {
        width: 25%;
        margin: auto;
    }
</style>