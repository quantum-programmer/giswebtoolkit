<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        min-height="450"
    >
        <v-card
            elevation="0"
            class="mx-2"
        >
            <div
                v-for="button in buttons"
                :key="button.id"
            >
                <gwtk-button
                    clean
                    :disabled="!button.enabled"
                    :title="$t(button.options.title)"
                    :icon="button.options.icon"
                    align-content="left"
                    width-available
                    :selected="button.active"
                    class="my-2"
                    @click="activateAction(button)"
                />
                <v-sheet v-if="button.active" outlined rounded class="pa-2">
                    <v-row
                        v-if="linkPanel.components.length>0"
                        class="ma-1"
                    >
                        <v-tooltip
                            v-for="(component, index) in linkPanel.components"
                            :key="index"
                            bottom
                            :disabled="!component.enabled"
                        >
                            <template #activator="{ on }">
                                <gwtk-button
                                    clean
                                    class="mx-1"
                                    :icon="component.options.icon"
                                    :selected="component.active"
                                    :disabled="!component.enabled"
                                    v-on="on"
                                    @click="()=>setState(component.id,!component.active)"
                                />
                            </template>
                            <div>{{ $t(component.options.title) }}</div>
                        </v-tooltip>
                    </v-row>
                    <!--                    <div v-if="actionMessage!==undefined">-->
                    <!--                        {{ $t('phrases.' + actionMessage) }}-->
                    <!--                    </div>-->

                    <template v-if="modePanelDescriptions.length!==0">
                        <div
                            v-for="(modePanelDescription, modePanelDescriptionIndex) in modePanelDescriptions"
                            :key="modePanelDescriptionIndex"
                            :hidden="!modePanelDescription.visible"
                        >
                            <div
                                v-if="modePanelDescription.title"
                                class="text-body-1 px-2 pt-2"
                            >
                                {{ $t('phrases.' + modePanelDescription.title) }}
                            </div>
                            <div class="gwtk-actions-buttons">
                                <v-tooltip
                                    v-for="modePanelButton in modePanelDescription.buttons"
                                    :key="modePanelButton.id"
                                    :disabled="!modePanelButton.enabled||!modePanelButton.options.title"
                                    bottom
                                >
                                    <template #activator="{ on }">
                                        <gwtk-icon-button
                                            v-if="modePanelButton.options.theme!=='primary'&&modePanelButton.options.theme!=='secondary'"
                                            :disabled="!modePanelButton.enabled"
                                            :icon="modePanelButton.options.icon"
                                            :selected="modePanelButton.active"
                                            icon-size="32"
                                            v-on="on"
                                            @click="()=>setState(modePanelButton.id,!modePanelButton.active)"
                                        >
                                            {{ $t(modePanelButton.options.label) }}
                                        </gwtk-icon-button>
                                        <gwtk-button
                                            v-else
                                            :disabled="!modePanelButton.enabled"
                                            :icon="modePanelButton.options.icon"
                                            :selected="modePanelButton.active"
                                            :primary="modePanelButton.options.theme==='primary'"
                                            :secondary="modePanelButton.options.theme==='secondary'"
                                            icon-size="32"
                                            width="45%"
                                            v-on="on"
                                            @click="()=>setState(modePanelButton.id,!modePanelButton.active)"
                                        >
                                            {{ $t(modePanelButton.options.label) }}
                                        </gwtk-button>
                                    </template>
                                    <div>{{ $t(modePanelButton.options.title) }}</div>
                                </v-tooltip>
                            </div>
                        </div>
                    </template>
                    <v-row class="ma-1" :bind="result">
                        {{ result }}
                    </v-row>
                </v-sheet>
            </div>
        </v-card>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkMeasurementsWidget.ts" />

<style scoped>
    .disabled-action {
        opacity: 0.5
    }

    .gwtk-actions-buttons {
        margin-top: 16px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
    }
</style>
