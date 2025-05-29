<template>
    <div v-if="!$vuetify.breakpoint.smAndUp && getActivePanel">
        <template v-if="modePanelDescriptions.length!==0">
            <div
                v-for="(modePanelDescription, modePanelDescriptionIndex) in modePanelDescriptions"
                :key="modePanelDescriptionIndex"
                :hidden="!modePanelDescription.enabled"
            >
                <div
                    v-if="modePanelDescription.title"
                    class="text-body-1"
                >
                    {{ $t('phrases.' + modePanelDescription.title) }}
                </div>
                <div class="d-flex justify-space-between">
                    <v-tooltip
                        v-for="modePanelButton in modePanelDescription.buttons"
                        :key="modePanelButton.id"
                        :disabled="!modePanelButton.enabled||!modePanelButton.options.title"
                        bottom
                    >
                        <template #activator="{ on }">
                            <gwtk-button
                                class="pointer-events"
                                :disabled="!modePanelButton.enabled"
                                :icon="modePanelButton.options.icon"
                                :primary="modePanelButton.options.theme==='primary'"
                                :secondary="modePanelButton.options.theme==='secondary'"
                                :clean="modePanelButton.options.theme!=='primary'&&modePanelButton.options.theme!=='secondary'"
                                :selected="modePanelButton.active"
                                icon-color="grey-05"
                                :icon-size="32"
                                :title="$t(modePanelButton.options.label)"
                                v-on="on"
                                @click="buttonClick(modePanelButton.id)"
                            />
                        </template>
                        <div>{{ $t(modePanelButton.options.title) }}</div>
                    </v-tooltip>
                </div>
            </div>
        </template>
    </div>
</template>

<script lang="ts" src="./GwtkTopPanel.ts" />

<style scoped>
    .pointer-events {
        pointer-events: all;
    }
</style>