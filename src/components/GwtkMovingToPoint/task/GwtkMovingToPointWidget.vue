<template>
    <v-row
        v-if="$vuetify.breakpoint.xs"
        dense
        no-gutters
        class="gwtk-container"
        justify="space-around"
        align-content="center"
    >
        <v-sheet class="container-block rounded z-index" />
        <v-col class="text-center">
            {{ latitude }}
        </v-col>
        <v-col cols="auto">
            <v-divider
                class="mt-0"
                role="presentation"
                vertical
            />
        </v-col>
        <v-col class="text-center">
            {{ longitude }}
        </v-col>
    </v-row>
    <v-row
        v-else
        dense
        no-gutters
        class="gwtk-moving-to-point"
    >
        <v-col
            class="mr-3 gwtk-moving-to-point-col"
            style="position: relative;"
            cols="auto"
        >
            <v-sheet class="container-block rounded z-index" />
            <div class="d-flex container-body-desktop">
                <div
                    class="ml-5 text-body-1"
                >
                    {{ latitudeTitle + unitTitle }}
                </div>
                <gwtk-degrees-minutes-seconds
                    v-if="isDegreesMinutesSeconds"
                    :coordinate-value="latitude"
                    coordinate-type="lat"
                    input-class="mt-0"
                    style="width: 136px;"
                    @input="inputDegreesValue"
                    @paste="clipboardPasteCoordinate"
                />
                <v-text-field
                    v-else-if="isDegrees"
                    v-model="latitude"
                    :background-color="moveToPointActive?'currentColor':'transparent'"
                    :outlined="moveToPointActive"
                    :solo="!moveToPointActive"
                    class="text-field"
                    dense
                    flat
                    hide-details
                    hide-spin-buttons
                    @click.native="activeMoveToPoint"
                    @paste="clipboardPasteCoordinate"
                />
                <v-text-field
                    v-else
                    v-model="XPlane"
                    :background-color="moveToPointActive?'currentColor':'transparent'"
                    class="shrink text-field"
                    :suffix="meterSuffix"
                    dense
                    flat
                    hide-details
                    hide-spin-buttons
                    solo
                    @click="activeMoveToPoint"
                    @paste="clipboardPasteCoordinate"
                />
                <v-divider
                    class="mx-1"
                />
                <div class="text-body-1">
                    {{ longitudeTitle + unitTitle }}
                </div>
                <gwtk-degrees-minutes-seconds
                    v-if="isDegreesMinutesSeconds"
                    :coordinate-value="longitude"
                    coordinate-type="long"
                    input-class="mt-0"
                    style="width: 128px;"
                    @input="inputDegreesValue"
                    @paste="clipboardPasteCoordinate"
                />
                <v-text-field
                    v-else-if="isDegrees"
                    v-model="longitude"
                    :background-color="moveToPointActive?'currentColor':'transparent'"
                    :outlined="moveToPointActive"
                    :solo="!moveToPointActive"
                    class="text-field"
                    dense
                    flat
                    hide-details
                    hide-spin-buttons
                    @click.native="activeMoveToPoint"
                    @paste="clipboardPasteCoordinate"
                />
                <v-text-field
                    v-else
                    v-model="YPlane"
                    :background-color="moveToPointActive?'currentColor':'transparent'"
                    class="shrink text-field"
                    :suffix="meterSuffix"
                    dense
                    flat
                    hide-details
                    hide-spin-buttons
                    solo
                    @click="activeMoveToPoint"
                    @paste="clipboardPasteCoordinate"
                />
                <v-divider
                    class="mx-3 my-1 px-0"
                    inset
                    role="presentation"
                    vertical
                />
                <v-tooltip right>
                    <template #activator="{ on, attrs }">
                        <gwtk-icon-button
                            :disabled="checkCanCopy"
                            class="mr-2 gwtk-moving-to-point-btn"
                            icon="mdi-content-copy"
                            v-bind="attrs"
                            @click="toggleCopyToBuffer"
                            v-on="on"
                        />
                    </template>
                    <span>{{ toolTipCopy }}</span>
                </v-tooltip>
            </div>
        </v-col>
        <v-col
            cols="auto"
        >
            <template
                v-if="!(selectPointActive || moveToPointActive)"
            >
                <v-tooltip
                    right
                >
                    <template
                        #activator="{ on, attrs }"
                    >
                        <v-sheet class="button-sheet">
                            <gwtk-icon-button
                                icon="moving-to-point"
                                v-bind="attrs"
                                class="gwtk-moving-to-point-btn"
                                v-on="on"
                                @click="activeSelectToPoint"
                            />
                        </v-sheet>
                    </template>
                    <span>{{ toolTipMoveToPoint }}</span>
                </v-tooltip>
            </template>
            <v-row
                v-if="moveToPointActive||selectPointActive"
                align="center"
                dense
                no-gutters
            >
                <v-col
                    v-if="moveToPointActive"
                    cols="auto"
                    class="mr-2"
                >
                    <v-tooltip
                        right
                    >
                        <template
                            #activator="{ on, attrs }"
                        >
                            <gwtk-icon-button
                                class="button-size"
                                primary
                                icon="mdi-check"
                                v-bind="attrs"
                                v-on="on"
                                @click="movingToPointStart"
                            />
                        </template>
                        <span>{{ toolTipCheck }}</span>
                    </v-tooltip>
                </v-col>
                <v-col
                    v-if="moveToPointActive||selectPointActive"
                    cols="auto"
                >
                    <v-tooltip
                        right
                    >
                        <template
                            #activator="{ on, attrs }"
                        >
                            <gwtk-icon-button
                                class="button-size"
                                secondary
                                icon="mdi-close"
                                v-bind="attrs"
                                v-on="on"
                                @click="closeMoveToPoint"
                            />
                        </template>
                        <span>{{ toolTipClose }}</span>
                    </v-tooltip>
                </v-col>
            </v-row>
        </v-col>
    </v-row>
</template>

<script src="./GwtkMovingToPointWidget.ts" />

<style scoped>

    .gwtk-container {
        position: relative;
        width: 12em;
    }

    .container-block {
        opacity: 0.8;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
    }

    .container-body-desktop {
        align-items: center;
        cursor: default;
    }

    .z-index {
        z-index: -1;
    }

    .button-size {
        opacity: 0.8;
    }

    .button-sheet {
        border-radius: 50%;
        opacity: 0.8;
    }

    .text-field {
        width: 132px;
        padding: 0;
    }

</style>
