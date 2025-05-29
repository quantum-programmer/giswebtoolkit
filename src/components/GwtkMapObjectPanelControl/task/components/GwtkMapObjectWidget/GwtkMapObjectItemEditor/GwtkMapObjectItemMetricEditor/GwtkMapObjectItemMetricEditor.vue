<template>
    <div class="main-container gwtk-map-object-item-metric-editor">
        <v-row
            no-gutters
            align="center"
            class="mt-2 px-2"
            :class="isReducedSizeInterface?'mb-2':'mb-3'"
        >
            <v-col cols="auto">
                <gwtk-button
                    secondary
                    icon="plus"
                    icon-size="24"
                    :disabled="!availableMultiPolygon"
                    @click="addNewSubObject"
                />
            </v-col>
            <v-col
                cols="3"
                class="mx-1"
            >
                <v-select
                    v-model="selectedObjectNumber"
                    :disabled="!availableMultiPolygon"
                    :items="subObjectsIndexList"
                    :label="$t('mapobjectpanel.Subobject')"
                    class="shrink"
                    dense
                    flat
                    outlined
                    :menu-props="{contentClass: 'gwtk-object-item-editor-list'}"
                    hide-details
                    @change="updateContourAndCoordinatesListInSelectedSubObject"
                />
            </v-col>
            <v-col cols="auto">
                <gwtk-button
                    secondary
                    icon="minus"
                    icon-size="24"
                    :disabled="!availableMultiPolygon || subObjectsIndexList.length <= 1"
                    @click="removeSubObject"
                />
            </v-col>
            <v-spacer />
            <v-col cols="auto">
                <gwtk-button
                    secondary
                    icon="plus"
                    icon-size="24"
                    :disabled="!availableMultiplyContours"
                    @click="addNewContour"
                />
            </v-col>
            <v-col
                cols="3"
                class="mx-1"
            >
                <v-select
                    v-model="selectedContourNumber"
                    :disabled="!availableMultiplyContours"
                    :items="contourIndexList"
                    :label="$t('phrases.Contour')"
                    dense
                    flat
                    outlined
                    :menu-props="{contentClass: 'gwtk-object-item-editor-list'}"
                    hide-details
                    @change="updateCoordinatesListInSelectedContour"
                />
            </v-col>
            <v-col cols="auto">
                <gwtk-button
                    secondary
                    icon="minus"
                    icon-size="24"
                    :disabled="!availableMultiplyContours || contourIndexList.length <= 1"
                    @click="removeContour"
                />
            </v-col>
        </v-row>
        <v-row
            no-gutters
            align="center"
            :class="isReducedSizeInterface?'mb-2':'mb-4'"
            justify="space-between"
        >
            <v-col
                cols="auto"
                class="px-2"
            >
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <gwtk-button
                            secondary
                            icon="mdi-map-marker-plus-outline"
                            icon-size="24"
                            v-on="on"
                            @click="addNewPoint()"
                        />
                    </template>
                    <div>{{ $t('phrases.Add point') }}</div>
                </v-tooltip>
            </v-col>
            <v-col
                cols="auto"
                class="px-2"
            >
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <gwtk-button
                            secondary
                            icon="mdi-swap-vertical"
                            v-on="on"
                            @click="()=>reverseContour()"
                        />
                    </template>
                    <div>{{ $t('phrases.Reverse direction') }}</div>
                </v-tooltip>
            </v-col>
            <v-col
                cols="auto"
                class="px-2"
            >
                <v-tooltip bottom>
                    <template #activator="{ on }">
                        <gwtk-button
                            :disabled="isCanClose()"
                            secondary
                            icon="mdi-reload"
                            v-on="on"
                            @click="()=>closeContour()"
                        />
                    </template>
                    <div>{{ $t('phrases.Close object') }}</div>
                </v-tooltip>
            </v-col>
            <v-spacer />
            <v-col
                cols="auto"
                class="px-2"
            >
                <v-switch
                    v-model="showPointHeight"
                    :label="$t('phrases.Height')"
                    dense
                    class="mt-0 pt-0"
                    hide-details
                />
            </v-col>
            <v-col cols="auto">
                <v-switch
                    v-model="tableMod"
                    :label="$t('phrases.Miniature')"
                    dense
                    class="mt-0 pt-0 mr-2"
                    hide-details
                />
            </v-col>
        </v-row>
        <v-divider />
        <v-container class="point-list-container" :class="isReducedSizeInterface?'py-1':'py-3'" :style="{ height: isReducedSizeInterface ? 'calc(100% - 80px)' : 'calc(100% - 120px)' }">
            <!-- eslint-disable-next-line -->
            <div v-if="tableMod">
                <v-row>
                    <v-col cols="1">
                        {{ '№' }}
                    </v-col>
                    <v-col
                        cols="4"
                        style="display: flex; justify-content: center;"
                    >
                        {{ latitudeTitle + unitTitle }}
                    </v-col>
                    <v-col cols="3">
                        {{ longitudeTitle + unitTitle }}
                    </v-col>
                    <v-col cols="3">
                        {{ $t('phrases.Height') }}
                    </v-col>
                    <v-col cols="1" />
                </v-row>
                <v-virtual-scroll
                    bench="11"
                    :items="coordinatesList"
                    :item-height="'40px'"
                    class="gwtk-virtual-scroll"
                >
                    <template #default="{ index }">
                        <v-row
                            :key="index"
                            dense
                            align="center"
                            justify="space-between"
                        >
                            <v-col cols="1" class="gwtk-trimmed-string">
                                {{ (index + 1) }}
                            </v-col>
                            <v-col
                                cols="3"
                                class="px-2 ml-auto"
                                align="center"
                            >
                                <gwtk-degrees-minutes-seconds
                                    v-if="isDegreesMinutesSeconds"
                                    :coordinate-type="'lat'"
                                    :decimal-degrees="true"
                                    input-class="mt-0"
                                    :read-only="isLastPolygonPoint(index)"
                                    :coordinate-value="getEditPoint(index).x"
                                    @input="(value)=> changeX(index, value.value)"
                                />
                                <v-text-field
                                    v-else
                                    class="centered-input"
                                    :suffix="isMeters? $t('phrases.m') : ''"
                                    dense
                                    flat
                                    hide-details
                                    solo
                                    maxlength="13"
                                    :disabled="isLastPolygonPoint(index)"
                                    :value="getEditPoint(index).x"
                                    @change="(value)=> changeX(index, value)"
                                />
                            </v-col>
                            <v-col
                                cols="3"
                                class="px-1 ml-auto"
                                align="center"
                            >
                                <gwtk-degrees-minutes-seconds
                                    v-if="isDegreesMinutesSeconds"
                                    :coordinate-type="'long'"
                                    :decimal-degrees="true"
                                    input-class="mt-0"
                                    :read-only="isLastPolygonPoint(index)"
                                    :coordinate-value="getEditPoint(index).y"
                                    @input="(value)=> changeY(index, value.value)"
                                />
                                <v-text-field
                                    v-else
                                    class="centered-input"
                                    :suffix="isMeters? $t('phrases.m') : ''"
                                    dense
                                    flat
                                    hide-details
                                    solo
                                    maxlength="13"
                                    :disabled="isLastPolygonPoint(index)"
                                    :value="getEditPoint(index).y"
                                    @change="(value)=>changeY(index, value)"
                                />
                            </v-col>
                            <v-col
                                cols="2"
                                class="px-2 ml-auto"
                                align="center"
                            >
                                <v-text-field
                                    class="centered-input"
                                    :disabled="!showPointHeight || isLastPolygonPoint(index)"
                                    dense
                                    flat
                                    solo
                                    hide-details
                                    :value="getMapObjectPoint(index).h"
                                    @change="(value)=>changePointHeight(index, value)"
                                />
                            </v-col>
                            <v-col
                                cols="auto"
                                align="center"
                            >
                                <v-row
                                    align="center"
                                >
                                    <v-col cols="auto">
                                        <gwtk-button
                                            secondary
                                            :selected="index === selectedPointId"
                                            icon="geolocation"
                                            icon-size="18"
                                            @click="showPointInMap(index)"
                                        />
                                    </v-col>
                                    <v-col cols="auto" class="pr-6">
                                        <gwtk-button
                                            secondary
                                            icon="trash-can"
                                            icon-size="18"
                                            :disabled="isLastPolygonPoint(index)"
                                            @click="() => removePoint(index)"
                                        />
                                    </v-col>
                                </v-row>
                            </v-col>
                        </v-row>
                    </template>
                </v-virtual-scroll>
            </div>
            <v-expansion-panels
                v-else
                v-model="openedPanels"
                multiple
            >
                <gwtk-expansion-panel
                    v-for="(index) in coordinatesList"
                    :key="index"
                    :title="$t('phrases.Point')+' '+ (index + 1)"
                >
                    <v-row
                        no-gutters
                        align="center"
                        :class="isReducedSizeInterface?'mb-2':'mb-4'"
                    >
                        <v-col
                            cols="auto"
                            class="px-2 text-body-1"
                        >
                            {{ latitudeTitle + unitTitle }}
                        </v-col>
                        <v-col
                            cols="7"
                            class="px-2 ml-auto"
                        >
                            <gwtk-degrees-minutes-seconds
                                v-if="isDegreesMinutesSeconds"
                                :coordinate-type="'lat'"
                                :decimal-degrees="true"
                                input-class="mt-0"
                                :read-only="isLastPolygonPoint(index)"
                                :coordinate-value="getEditPoint(index).x"
                                @input="(value)=> changeX(index, value.value)"
                            />
                            <v-text-field
                                v-else
                                class="shrink"
                                :suffix="isMeters?'m':''"
                                dense
                                flat
                                outlined
                                hide-details
                                solo
                                :disabled="isLastPolygonPoint(index)"
                                :value="getEditPoint(index).x"
                                @change="(value)=> changeX(index, value)"
                            />
                        </v-col>
                    </v-row>
                    <v-row
                        no-gutters
                        align="center"
                        :class="isReducedSizeInterface?'mb-2':'mb-4'"
                    >
                        <v-col
                            cols="auto"
                            class="px-2 text-body-1"
                        >
                            {{ longitudeTitle + unitTitle }}
                        </v-col>
                        <v-col
                            cols="7"
                            class="px-2 ml-auto"
                        >
                            <gwtk-degrees-minutes-seconds
                                v-if="isDegreesMinutesSeconds"
                                :coordinate-type="'long'"
                                :decimal-degrees="true"
                                input-class="mt-0"
                                :read-only="isLastPolygonPoint(index)"
                                :coordinate-value="getEditPoint(index).y"
                                @input="(value)=> changeY(index, value.value)"
                            />
                            <v-text-field
                                v-else
                                class="shrink"
                                :suffix="isMeters?'m':''"
                                dense
                                flat
                                outlined
                                hide-details
                                solo
                                :disabled="isLastPolygonPoint(index)"
                                :value="getEditPoint(index).y"
                                @change="(value)=>changeY(index, value)"
                            />
                        </v-col>
                    </v-row>
                    <v-row
                        v-if="showPointHeight"
                        no-gutters
                        align="center"
                        :class="isReducedSizeInterface?'mb-2':'mb-4'"
                    >
                        <v-col
                            cols="auto"
                            class="px-2 text-body-1"
                        >
                            {{ $t('phrases.Height') }}
                        </v-col>
                        <v-col
                            cols="8"
                            class="px-2 ml-auto"
                        >
                            <v-text-field
                                class="shrink"
                                dense
                                flat
                                outlined
                                hide-details
                                solo
                                :disabled="isLastPolygonPoint(index)"
                                :value="getMapObjectPoint(index).h"
                                @change="(value)=>changePointHeight(index, value)"
                            />
                        </v-col>
                    </v-row>
                    <v-divider :class="isReducedSizeInterface?'mb-2':'mb-4'" />
                    <v-row
                        no-gutters
                        align="center"
                    >
                        <v-col
                            cols="auto"
                            class="px-2"
                        >
                            <gwtk-button
                                secondary
                                :selected="index === selectedPointId"
                                icon="geolocation"
                                icon-size="18"
                                @click="showPointInMap(index)"
                            />
                        </v-col>
                        <v-col
                            cols="auto"
                            class="px-2 ml-auto"
                        >
                            <gwtk-button
                                secondary
                                icon="trash-can"
                                icon-size="18"
                                :disabled="isLastPolygonPoint(index)"
                                @click="() => removePoint(index)"
                            />
                        </v-col>
                    </v-row>
                </gwtk-expansion-panel>
            </v-expansion-panels>
        </v-container>
        <v-divider />
    </div>
</template>

<script lang="ts" src="./GwtkMapObjectItemMetricEditor.ts" />

<style scoped>
.main-container {
    height: 100%;
}

.point-list-container {
    overflow-y: auto;
    overflow-x: hidden;
}

.centered-input {
    max-width: 200px;
}

.centered-input >>> input {
    text-align: center;
}

.gwtk-virtual-scroll {
    overflow: hidden;
}

.gwtk-trimmed-string {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
.gwtk-trimmed-string:hover {
    text-overflow: unset;
}
</style>
