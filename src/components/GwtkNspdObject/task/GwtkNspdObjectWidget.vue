<template>
    <gwtk-window-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        :min-width="600"
        :min-height="540"
    >
        <v-card-text class="gwtk-v-card-text pa-0 pt-3">
            <v-row>
                <v-col cols="0">
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
                </v-col>
                <v-col cols="auto">
                    <v-menu offset-y :close-on-content-click="false">
                        <template #activator="{ on: menu, attrs }">
                            <v-tooltip bottom>
                                <template #activator="{ on: tooltip }">
                                    <gwtk-icon-button
                                        class="mt-n1 mr-2"
                                        icon="settings"
                                        v-bind="attrs"
                                        v-on="{ ...tooltip, ...menu }"
                                    />
                                </template>
                                <div>{{ $t("nspd.Search settings") }}</div>
                            </v-tooltip>
                        </template>
                        <v-list>
                            <v-list-item-group v-model="selectedTypeIndex" multiple>
                                <v-list-item
                                    v-for="(item, index) in objectTypes"
                                    :key="index"
                                    @click="onSelectObjectType(item.id)"
                                >
                                    <v-list-item-icon>
                                        <v-icon
                                            v-if="getTypeChecked(item.id)"
                                        >
                                            mdi-check
                                        </v-icon>
                                    </v-list-item-icon>
                                    <v-list-item-content>
                                        {{ item.name }}
                                    </v-list-item-content>
                                </v-list-item>
                            </v-list-item-group>
                        </v-list>
                    </v-menu>
                </v-col>
            </v-row>
            <gwtk-tabs v-model="activeTabWidget">
                <gwtk-tab
                    v-for="item in objectsGroups"
                    :key="item.id"
                    :title="item.groupName"
                    style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                />
            </gwtk-tabs>
            <div v-if="showObject" :class="isReducedSizeInterface? 'gwtk-show-tab-div' : 'gwtk-show-tab-div-reduce'">
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
                                    v-for="(item, key) in mapObjectSemantics"
                                    :key="item.name + key"
                                >
                                    <td>{{ item.name }}</td>
                                    <td>{{ item.value }}</td>
                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>
                </v-row>
            </div>
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

<script lang="ts" src="./GwtkNspdObjectWidget.ts"></script>

<style scoped>
    .gwtk-v-card-text {
        height: 100%;
    }

    .gwtk-show-tab-div {
        height: calc(100% - var(--gwtk-page-toolbar-height) - 30px);
    }

    .gwtk-show-tab-div-reduce {
        height: calc(100% - var(--gwtk-page-toolbar-height) - 50px);
    }

    .gwtk-table-div {
        overflow-y: auto;
        height: calc(100% - 44px);
    }

    .gwtk-table-item {
        width: 100%;
    }
</style>