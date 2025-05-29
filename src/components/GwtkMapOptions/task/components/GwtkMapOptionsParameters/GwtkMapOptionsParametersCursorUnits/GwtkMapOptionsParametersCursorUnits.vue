<template>
    <gwtk-expansion-panel
        :title="$t('phrases.Coordinate system of cursor')"
    >
        <fieldset class="pb-2">
            <v-row dense>
                <v-col>
                    {{ cursorCoordinateParams.mapProjectionName }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-select
                        :value="cursorCoordinateParams.coordinates"
                        :items="cursorCoordinateSystemList"
                        outlined
                        dense
                        hide-details
                        :menu-props="{ bottom: true, offsetY: true }"
                        @change="changeCursorCoordinateSystem"
                    >
                        <template #selection="{ item }">
                            {{ getCursorCoordinateSystemText(item) }}
                        </template>
                        <template #item="{ item }">
                            <div class="v-list-item__content">
                                <div class="v-list-item__title">
                                    {{ getCursorCoordinateSystemText(item) }}
                                </div>
                            </div>
                        </template>
                    </v-select>
                </v-col>
            </v-row>
        </fieldset>
    </gwtk-expansion-panel>
</template>

<script lang="ts" src="./GwtkMapOptionsParametersCursorUnits.ts" />