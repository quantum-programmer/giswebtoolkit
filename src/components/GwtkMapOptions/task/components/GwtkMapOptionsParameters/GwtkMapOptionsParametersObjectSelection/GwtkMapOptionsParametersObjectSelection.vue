<template>
    <gwtk-expansion-panel
        :title="$t('phrases.Object selection')"
    >
        <v-form>
            <fieldset class="pb-2">
                <v-row dense>
                    <v-col>
                        {{ $t('phrases.Stroke color') }}
                    </v-col>
                </v-row>
                <v-row dense>
                    <v-col>
                        <v-text-field
                            :value="objectSelection.lineColor"
                            outlined
                            dense
                            hide-details
                            readonly
                        >
                            <template #append>
                                <v-menu
                                    top
                                    :close-on-content-click="false"
                                    z-index="100"
                                >
                                    <template #activator="{ on }">
                                        <div
                                            :style="lineColorStyle"
                                            v-on="on"
                                        />
                                    </template>
                                    <v-card>
                                        <v-card-text class="pa-0">
                                            <v-color-picker
                                                class="gwtk-test-color-picker-selection"
                                                :value="objectSelection.lineColor"
                                                mode="hexa"
                                                hide-mode-switch
                                                @update:color="changeTextColor"
                                            />
                                        </v-card-text>
                                    </v-card>
                                </v-menu>
                            </template>
                        </v-text-field>
                    </v-col>
                </v-row>
            </fieldset>
            <fieldset>
                <v-row dense>
                    <v-col>
                        {{ $t('phrases.Signatures selection') }}
                    </v-col>
                </v-row>
                <v-row dense>
                    <v-col>
                        <v-select
                            :value="objectSelection.signaturesSelection"
                            :items="selectingSignaturesList"
                            outlined
                            dense
                            hide-details
                            :menu-props="{ bottom: true, offsetY: true }"
                            @change="changeSelectingSignatures"
                        >
                            <template #selection="{ item }">
                                {{ $t('phrases.' + item) }}
                            </template>
                            <template #item="{ item }">
                                <div class="v-list-item__content">
                                    <div class="v-list-item__title">
                                        {{ $t('phrases.' + item) }}
                                    </div>
                                </div>
                            </template>
                        </v-select>
                    </v-col>
                </v-row>
            </fieldset>
        </v-form>
    </gwtk-expansion-panel>
</template>

<script lang="ts" src="./GwtkMapOptionsParametersObjectSelection.ts" />
