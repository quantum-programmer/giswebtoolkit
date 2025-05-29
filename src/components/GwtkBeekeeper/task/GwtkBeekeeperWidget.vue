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
                <v-row
                    v-if="linkPanel.components.length > 0"
                    class="ma-1"
                >
                    <v-tooltip
                        v-for="(component, index) in linkPanel.components"
                        :key="index"
                        bottom
                        :disabled="!component.enabled"
                    >
                        <template #activator="{ on }">
                            <gwtk-button
                                clean
                                :icon="getButtonIcon(component.id)"
                                :icon-size="28"
                                :selected="component.active"
                                :disabled="!component.enabled"
                                class="ma-2"
                                v-on="on"
                                @click="()=>setState(component.id,!component.active)"
                            />
                        </template>
                        <div>{{ $t( getButtonDescription(component.id) ) }}</div>
                    </v-tooltip>
                    <v-tooltip
                        v-if="linkPanelActiveState === 'edit'"
                        bottom
                    >
                        <template #activator="{ on }">
                            <gwtk-button
                                clean
                                icon="list"
                                :icon-size="28"
                                :selected="false"
                                :disabled="false"
                                class="ma-2 no-focus-button"
                                v-on="on"
                                @click="updateActualObjectsList"
                            />
                        </template>
                        <div>{{ $t('beekeeper.Update list of objects') }}</div>
                    </v-tooltip>
                    <v-tooltip
                        v-if="linkPanelActiveState === 'add'"
                        bottom
                    >
                        <template #activator="{ on }">
                            <gwtk-button
                                clean
                                :icon="'rgis/icons/addbygeolocation'"
                                :icon-size="28"
                                :selected="false"
                                :disabled="isGeolocationEnabled"
                                class="ma-2 no-focus-button"
                                v-on="on"
                                @click="createApiaryByLocation"
                            />
                        </template>
                        <div>{{ $t('beekeeper.Add an apiary according to the current location') }}</div>
                    </v-tooltip>
                </v-row>
                <v-divider />
                <v-row class="mt-1" style="height: 82%">
                    <v-col v-if="linkPanelActiveState === 'add'">
                        {{ result }}
                    </v-col>
                    <v-col
                        v-else-if="linkPanelActiveState === 'edit'"
                        class="pa-1"
                        style="height: 100%"
                    >
                        <gwtk-beekeeper-map-object-widget
                            :set-state="setState"
                            :map-vue="mapVue"
                            :map-objects="mapObjects"
                            :found-map-objects-number="foundMapObjectsNumber"
                            :selected-map-object="selectedMapObject"
                            :show-map-objects-update-overlay="showMapObjectsUpdateOverlay"
                            class="gwtk-flex-1"
                        />
                    </v-col>
                </v-row>
            </v-sheet>
        </v-container>
        <v-container
            class="pa-0"
            :style="showPanelStyle ? 'display:block;':'display:none;'"
        >
            <v-container
                v-if="currentMapObjectDataFromDB && currentMapObjectDataFromDB.result.length !== 0"
                class="pa-1"
            >
                <v-row
                    v-if="linkPanelActiveState === 'edit'"
                    dense
                >
                    <v-col>
                        <gwtk-button
                            secondary
                            :title="$t('beekeeper.Move the apiary according to the current location')"
                            :icon="'rgis/icons/editbygeolocation'"
                            :icon-size="64"
                            :icon-color="'blue-06'"
                            class="ExistingApiaryChangeLocationButton no-focus-button"
                            :selected="false"
                            :disabled="isGeolocationEnabled"
                            @click="editApiaryPositionByLocation"
                        />
                    </v-col>
                </v-row>
                <v-row
                    v-if="userFullName !== ''"
                    dense
                >
                    <v-col class="pl-2">
                        {{ $t('beekeeper.Full name of the owner of the apiary') }}
                    </v-col>
                </v-row>
                <v-row
                    v-if="userFullName !== ''"
                    dense
                >
                    <v-col>
                        <v-text-field
                            :value="userFullName"
                            :disabled="true"
                            outlined
                            dense
                            hide-details="auto"
                        />
                    </v-col>
                </v-row>
                <v-row
                    v-if="beekeeperStatus !== ''"
                    dense
                >
                    <v-col class="pl-2">
                        {{ $t('beekeeper.Beekeeper status') }}
                    </v-col>
                </v-row>
                <v-row
                    v-if="beekeeperStatus !== ''"
                    dense
                >
                    <v-col>
                        <v-text-field
                            :value="beekeeperStatus"
                            :disabled="true"
                            outlined
                            dense
                            hide-details="auto"
                        />
                    </v-col>
                </v-row>
                <v-row dense>
                    <v-col class="pl-2">
                        {{ $t('beekeeper.Type of apiary') }}
                    </v-col>
                </v-row>
                <v-row dense>
                    <v-text-field
                        :value="apiaryTypeString"
                        :disabled="true"
                        outlined
                        dense
                        hide-details="auto"
                    />
                </v-row>
                <template
                    v-for="(item, index) in currentMapObjectDataFromDB.result"
                >
                    <v-row
                        v-if="!item.hidden"
                        :key="'fieldName_' + index"
                        dense
                    >
                        <v-col class="pl-2">
                            {{ item.name }}
                        </v-col>
                    </v-row>
                    <v-row
                        v-if="!item.hidden"
                        :key="'fieldValue_' + index"
                        dense
                    >
                        <template
                            v-if="item.key === 'name'"
                        >
                            <v-col
                                :cols="apiaryType === '1' ? '12' : '10'"
                            >
                                <v-text-field
                                    :value="item.value"
                                    :type="item.type === 0 ? 'text' : 'number'"
                                    :disabled="item.disabled"
                                    outlined
                                    dense
                                    hide-details="auto"
                                    @input="(value) => setValue(item.key, value)"
                                />
                            </v-col>
                            <v-col
                                v-if="apiaryType !== '1'"
                                cols="2"
                                class="ma-auto"
                                :align="'right'"
                            >
                                <gwtk-button
                                    clean
                                    :icon="'trash-can'"
                                    :icon-size="20"
                                    :selected="false"
                                    :disabled="false"
                                    class="no-focus-button"
                                    @click="deleteSelectedObject"
                                />
                            </v-col>
                        </template>
                        <template v-else>
                            <v-col class="d-flex" cols="12">
                                <gwtk-date-time-picker
                                    v-if="item.type === 17 && item.key !== 'message'"
                                    :datetime="item.value"
                                    time-format="HH:mm:ss"
                                    :ok-text="$t('phrases.Select')"
                                    :date-picker-props="datePickerProps"
                                    :time-picker-props="timePickerProps"
                                    @input="(value) => setDateValue(item.key, value)"
                                />
                                <v-autocomplete
                                    v-else-if="item.type === 16 && item.key !== 'message'"
                                    v-model="item.value"
                                    :items="additionalInformation.result.sprav_hazard_classes"
                                    item-text="value"
                                    item-value="key"
                                    outlined
                                    dense
                                    hide-details
                                    :menu-props="{ bottom: true, offsetY: true }"
                                    @input="(value) => setValue(item.key, value)"
                                />
                                <v-textarea
                                    v-else-if="item.key === 'message'"
                                    :value="item.value"
                                    :readonly="item.disabled"
                                    auto-grow
                                    outlined
                                    dense
                                    hide-details="auto"
                                    @input="(value) => setValue(item.key, value)"
                                />
                                <v-textarea
                                    v-else-if="item.key === 'address'"
                                    :value="item.value === '' ? mapObjectAddress: item.value"
                                    :readonly="item.disabled"
                                    auto-grow
                                    outlined
                                    dense
                                    hide-details="auto"
                                    rows="1"
                                    @input="(value) => setValue(item.key, value)"
                                />
                                <v-text-field
                                    v-else
                                    :value="item.value"
                                    :type="item.type === 0 ? 'text' : 'number'"
                                    :disabled="item.disabled"
                                    min="0"
                                    outlined
                                    dense
                                    hide-details="auto"
                                    @input="(value) => setValue(item.key, value)"
                                />
                            </v-col>
                        </template>
                    </v-row>
                </template>
            </v-container>
            <v-container class="pt-0 mt-1">
                <v-row dense justify="space-between">
                    <v-col cols="auto">
                        <gwtk-button
                            secondary
                            :title="$t('phrases.Save')"
                            icon="mdi-check"
                            class="mt-1 ml-1"
                            @click="save"
                        />
                    </v-col>
                    <v-col cols="auto">
                        <gwtk-button
                            secondary
                            :title="$t('phrases.Cancel')"
                            class="mt-1 ml-2 mr-1"
                            @click="close"
                        />
                    </v-col>
                </v-row>
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
        </v-container>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkBeekeeperWidget.ts" />

<style>
    .objectTitle {
        color: var(--color-blue-06);
        font-weight: 600;
        margin-bottom: 4px;
        white-space: normal;
    }

    .ExistingApiaryChangeLocationButton {
        min-height: 64px !important;
    }

    .ExistingApiaryChangeLocationButton span.gwtk-button-title {
        white-space: normal !important;
        text-overflow: unset !important;
        overflow: unset !important;
        flex: auto !important;
    }

    .no-focus-button:before {
        opacity: 0 !important;
    }
</style>