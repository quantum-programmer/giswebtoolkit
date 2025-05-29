<template>
    <gwtk-expansion-panel
        :title="$t('phrases.Object search')"
    >
        <v-form>
            <fieldset class="pb-2">
                <v-row dense>
                    <v-col class="pb-0 ml-1 mr-1">
                        {{ $t('phrases.Capture radius (px)') }}
                        <v-slider
                            :value="objectSearch.pixelRadius"
                            :thumb-label="true"
                            :thumb-size="32"
                            min="1"
                            max="50"
                            hide-details
                            @change="changePixelRadius"
                        />
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        <v-select
                            class=""
                            :items="sortTypes.type"
                            item-text="text"
                            item-value="type"
                            :value="currentSearchFilter || sortTypes.type[0]"
                            outlined
                            hide-details
                            dense
                            @change="setSearchFilter"
                        />
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        <v-select
                            class=""
                            :items="sortTypes.direction"
                            item-text="text"
                            item-value="direction"
                            :value="currentSearchDirection || sortTypes.direction[0]"
                            outlined
                            hide-details
                            dense
                            @change="setSearchDirection"
                        />
                    </v-col>
                </v-row>
            </fieldset>
        </v-form>
    </gwtk-expansion-panel>
</template>

<script lang="ts" src="./GwtkMapOptionsParametersObjectSearch.ts" />