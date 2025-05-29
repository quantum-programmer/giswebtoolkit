<template>
    <gwtk-expansion-panel
        :title="$t('phrases.Units')"
    >
        <fieldset class="pb-2">
            <v-row dense>
                <v-col>
                    {{ $t('phrases.Unit of length') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-select
                        :value="units.perimeter"
                        :items="lengthUnitList"
                        outlined
                        dense
                        hide-details
                        :menu-props="{ bottom: true, offsetY: true }"
                        @change="changeLengthUnit"
                    >
                        <template #selection="{ item }">
                            <div class="v-select__selection v-select__selection--comma">
                                {{ getUnitText(item) }}
                            </div>
                        </template>
                        <template #item="{ item }">
                            <div class="v-list-item__content">
                                <div class="v-list-item__title">
                                    {{ getUnitText(item) }}
                                </div>
                            </div>
                        </template>
                    </v-select>
                </v-col>
            </v-row>
        </fieldset>
        <fieldset class="pb-2">
            <v-row dense>
                <v-col>
                    {{ $t('phrases.Unit of area') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-select
                        :value="units.area"
                        :items="areaUnitList"
                        outlined
                        dense
                        hide-details
                        :menu-props="{ bottom: true, offsetY: true }"
                        @change="changeAreaUnit"
                    >
                        <template #selection="{ item }">
                            {{ getUnitText(item) }}
                        </template>
                        <template #item="{ item }">
                            <div class="v-list-item__content">
                                <div class="v-list-item__title">
                                    {{ getUnitText(item) }}
                                </div>
                            </div>
                        </template>
                    </v-select>
                </v-col>
            </v-row>
        </fieldset>
        <fieldset class="pb-2">
            <v-row dense>
                <v-col>
                    {{ $t('phrases.Units of measurement of angles') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-select
                        :value="units.angle"
                        :items="angleUnitList"
                        outlined
                        dense
                        hide-details
                        :menu-props="{ bottom: true, offsetY: true }"
                        @change="changeAngleUnit"
                    >
                        <template #selection="{ item }">
                            {{ getAngleText(item) }}
                        </template>
                        <template #item="{ item }">
                            <div class="v-list-item__content">
                                <div class="v-list-item__title">
                                    {{ getAngleText(item) }}
                                </div>
                            </div>
                        </template>
                    </v-select>
                </v-col>
            </v-row>
        </fieldset>
    </gwtk-expansion-panel>
</template>

<script lang="ts" src="./GwtkMapOptionsParametersUnits.ts" />
<style scoped>
.gwtk-expansion-panel .gwtk-expansion-panel-header {
    min-height: 40px;
}
</style>