<template>
    <gwtk-expansion-panel
        :title="$t('phrases.Layers refresh interval')"
    >
        <fieldset>
            <v-row dense>
                <v-col>
                    {{ $t('phrases.Refresh interval (seconds)') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-text-field
                        :value="refreshInterval"
                        :min="0"
                        type="number"
                        outlined
                        dense
                        hide-details="auto"
                        @input="changeRefreshInterval"
                    />
                </v-col>
            </v-row>
        </fieldset>
    </gwtk-expansion-panel>
</template>

<script lang="ts" src="./GwtkMapOptionsParametersRefreshInterval.ts" />