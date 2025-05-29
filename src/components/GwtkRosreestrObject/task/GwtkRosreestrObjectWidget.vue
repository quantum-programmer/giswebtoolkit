<template>
    <gwtk-window-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        :min-width="600"
        :min-height="540"
        :show-dialog="showDialog"
    >
        <v-card-text class="gwtk-v-card-text pa-0 pt-3">
            <v-text-field
                hide-details
                dense
                :label="$t('phrases.Search')"
                :value="searchText"
                outlined
                clearable
                @input="onInput"
                @click:clear="clearSearchText"
                @click:prepend-inner="search"
                @keyup.enter="search"
            >
                <template #append>
                    <div class="v-input__icon align-center">
                        <gwtk-icon-button
                            icon="search"
                            @click="search"
                        />
                    </div>
                </template>
            </v-text-field>
            <v-row dense no-gutters justify="start" class="mt-2">
                <v-switch
                    v-model="mapClickFlag"
                    class="my-0"
                    :label="$t('rosreestcontent.Capturing coordinates at a point on the map')"
                    hide-details
                    hide-spin-buttons
                    dense
                />
            </v-row>
            <v-container
                class="container-class pa-0"
            >
                <gwtk-tabs
                    v-model="activeTabWidget"
                >
                    <gwtk-tab :title="$t('rosreestcontent.District')" />
                    <gwtk-tab :title="$t('rosreestcontent.Area')" />
                    <gwtk-tab :title="$t('rosreestcontent.Quarter')" />
                    <gwtk-tab :title="$t('rosreestcontent.Plot')" />
                    <gwtk-tab :title="$t('rosreestcontent.OKS')" />
                    <gwtk-tab :title="$t('rosreestcontent.Border')" />
                    <gwtk-tab :title="$t('rosreestcontent.Zones with special conditions for the use of territories')" />
                    <gwtk-tab :title="$t('rosreestcontent.Territorial zones')" />
                    <gwtk-tab :title="$t('rosreestcontent.Forestry')" />
                    <gwtk-tab :title="$t('rosreestcontent.Specially protected natural areas')" />
                    <gwtk-tab :title="$t('rosreestcontent.Free economic zones')" />
                </gwtk-tabs>

                <div
                    v-if="showObject"
                    class="gwtk-show-tab-div"
                >
                    <v-row dense no-gutters class="align-baseline">
                        <v-col class="font-weight-bold">
                            {{ cadNumberText }}
                        </v-col>
                        <v-col cols="auto">
                            <gwtk-icon-button
                                icon="prev"
                                :icon-size="32"
                                :selected="hasPreviousObject"
                                :disabled="!hasPreviousObject"
                                @click="prevObjectInfo"
                                @click.stop="$emit('mapobject:showInMap')"
                            />
                        </v-col>
                        <v-col cols="auto">
                            <gwtk-icon-button
                                icon="next"
                                :icon-size="32"
                                :selected="hasNextObject"
                                :disabled="!hasNextObject"
                                @click="nextObjectInfo"
                                @click.stop="$emit('mapobject:showInMap')"
                            />
                        </v-col>
                        <v-col cols="auto">
                            <gwtk-button
                                class="my-1"
                                icon="geolocation"
                                :icon-size="18"
                                secondary
                                :selected="showInMap"
                                @click.stop="$emit('mapobject:showInMap')"
                                @click="showObjectInMap"
                            />
                        </v-col>
                    </v-row>
                    <v-row dense no-gutters class="gwtk-table-div">
                        <v-simple-table class="gwtk-table-item">
                            <template #default>
                                <tbody>
                                    <tr
                                        v-for="item in mapObjectSemantics"
                                        :key="item.name"
                                    >
                                        <td>{{ item.name }}</td>
                                        <td>{{ item.valueRosreestrObject }}</td>
                                    </tr>
                                </tbody>
                            </template>
                        </v-simple-table>
                    </v-row>
                </div>
            </v-container>
        </v-card-text>

        <v-overlay
            :value="searchProgressBar"
            :absolute="searchProgressBar"
            z-index="100"
        >
            <v-row no-gutters dense align="center" justify="center">
                <v-progress-circular
                    :active="searchProgressBar"
                    indeterminate
                    size="64"
                >
                    <gwtk-icon-button
                        large
                        icon="close-icon"
                        @click="closeOverlay"
                    />
                </v-progress-circular>
            </v-row>
        </v-overlay>
    </gwtk-window-item>
</template>

<script lang="ts" src="./GwtkRosreestrObjectWidget.ts"></script>

<style scoped>
    .gwtk-v-card-text {
        height: 100%;
    }

    .container-class {
        height: calc(100% - var(--list-item-min-height-dense) - 4px - 28px - 8px);
    }

    .gwtk-show-tab-div {
        height: calc(100% - var(--gwtk-page-toolbar-height));
    }

    .gwtk-table-div {
        overflow-y: auto;
        height: calc(100% - 44px);
    }

    .gwtk-table-item {
        width: 100%;
    }
</style>
