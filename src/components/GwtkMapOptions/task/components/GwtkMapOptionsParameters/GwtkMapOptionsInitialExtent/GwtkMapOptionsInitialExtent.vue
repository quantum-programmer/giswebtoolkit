<template>
    <gwtk-expansion-panel :title="$t('phrases.Show initial extent')">
        <v-container class="pa-0">
            <v-checkbox
                :input-value="initialExtent.resetMapContent"
                :label="$t('mapoptions.Restore map content')"
                @change="toggleResetMapContent"
            />
        </v-container>
    </gwtk-expansion-panel>
</template>

<script lang="ts" src="./GwtkMapOptionsInitialExtent.ts" />