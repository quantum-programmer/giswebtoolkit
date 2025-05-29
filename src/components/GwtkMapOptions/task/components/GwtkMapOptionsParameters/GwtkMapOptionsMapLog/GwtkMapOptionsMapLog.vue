<template>
    <gwtk-expansion-panel :title="$t('phrases.Log of Map events')">
        <v-container class="pa-0">
            <v-switch
                :input-value="mapLog.debugMode"
                :label="$t('mapoptions.Debug mode')"
                @change="toggleDebugMode"
            />
        </v-container>
    </gwtk-expansion-panel>
</template>

<script lang="ts" src="./GwtkMapOptionsMapLog.ts" />