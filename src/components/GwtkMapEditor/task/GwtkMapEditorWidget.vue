<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        min-height="450"
    >
        <div v-if="publishObject.isPublished">
            <gwtk-map-editor-object-publish
                :map-vue="mapVue"
                :set-state="setState"
                :publish-object="publishObject"
            />
        </div>
        <div v-else-if="publishObject.isManualInput" style="height: 100%">
            <gwtk-map-editor-manual-input-coords
                class="gwtk-map-editor"
                :map-vue="mapVue"
                :set-state="setState"
                :publish-object="publishObject"
            />
        </div>
        <template v-else>
            <v-overlay :value="isWaitCapturing" absolute>
                <v-progress-circular
                    indeterminate
                    size="64"
                >
                    <gwtk-icon-button
                        large
                        icon="close-icon"
                        @click="stopWaitCapturing"
                    />
                </v-progress-circular>
            </v-overlay>
            <div>
                <div
                    v-if="layerItems.length > 0"
                    class="gwtk-map-editor my-1 px-2"
                >
                    <v-row dense>
                        <v-col class="text-subtitle-1 mb-2">
                            {{ $t('mapeditor.Layer operations') }}
                        </v-col>
                        <v-col cols="auto">
                            <v-tooltip
                                v-for="button in buttons"
                                v-if="!checkExpansionPanelButton(button.id) && !isLocalLayerSelected"
                                :key="button.id"
                                bottom
                            >
                                <template #activator="{ on }">
                                    <gwtk-icon-button
                                        :icon="button.options.icon"
                                        :disabled="!button.enabled"
                                        :selected="button.enabled&&button.active"
                                        v-on="on"
                                        @click="()=>setState(button.id,!button.active)"
                                    />
                                </template>
                                <div>{{ $t(button.options.title) }}</div>
                            </v-tooltip>
                        </v-col>
                    </v-row>
                    <v-row dense class="flex-nowrap">
                        <v-col
                            cols="11"
                        >
                            <v-select
                                dense
                                hide-details
                                outlined
                                :value="selectedLayerXId"
                                :items="layerItems"
                                item-value="id"
                                class="ml-1"
                                @change="selectLayoutLayerXId"
                            />
                        </v-col>
                        <v-col
                            v-if="!isLocalLayerSelected"
                            cols="1"
                        >
                            <v-tooltip
                                bottom
                            >
                                <template #activator="{ on }">
                                    <gwtk-icon-button
                                        :disabled="isUndoForLayerDisabled"
                                        icon="undo-variant"
                                        v-on="on"
                                        @click="toggleUndoForSelectedLayer"
                                    />
                                </template>
                                <div>{{ $t('mapeditor.Undo last changes for selected layer') }}</div>
                            </v-tooltip>
                        </v-col>
                    </v-row>
                    <v-divider :class="isReducedSizeInterface?'mt-2 mb-1':'mt-4 mb-2'" />
                </div>
                <v-container
                    v-else
                    class="mx-2"
                >
                    {{ $t('mapeditor.There are no layers of editing') }}
                </v-container>
                <v-card
                    elevation="0"
                    class="mx-2 gwtk-map-editor-buttons"
                >
                    <div
                        v-for="button in buttons"
                        v-if="checkExpansionPanelButton(button.id)"
                        :key="button.id"
                    >
                        <gwtk-button
                            clean
                            :title="$t(button.options.title)"
                            :icon="button.options.icon"
                            align-content="left"
                            width-available
                            :selected="button.active"
                            :disabled="!button.enabled"
                            :class="isReducedSizeInterface?'my-1':'my-2'"
                            @click="activateAction(button)"
                        />
                        <v-sheet
                            v-if="button.active&&!hideContent" outlined rounded
                            :class="isReducedSizeInterface?'py-1 px-2':'pa-2'"
                        >
                            <v-row v-if="actionMessage!==undefined" no-gutters>
                                {{ actionMessage }}
                            </v-row>
                            <div
                                v-for="(modePanelDescription, modePanelDescriptionIndex) in modePanelDescriptions"
                                :key="modePanelDescriptionIndex"
                                :hidden="!modePanelDescription.visible"
                            >
                                <div
                                    v-if="modePanelDescription.title && !isReducedSizeInterface"
                                    class="text-body-1"
                                >
                                    {{ $t('mapeditor.' + modePanelDescription.title) }}
                                </div>
                                <template
                                    v-if="modePanelDescription.buttons.length===0"
                                >
                                    <gwtk-copy-objects-mode
                                        v-if="checkCopyObjectWidget(button.id)"
                                        :set-state="setState"
                                        :layer-items="layerItems"
                                        :copy-action-info="copyActionInfo"
                                    />
                                </template>
                                <div
                                    v-else
                                    class="gwtk-actions-buttons"
                                    :class="isReducedSizeInterface?'py-1':'py-2'"
                                >
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
                                                :icon-size="isReducedSizeInterface?24:32"
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
                                                :icon-size="isReducedSizeInterface?24:32"
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
                        </v-sheet>
                    </div>
                </v-card>
                <div
                    v-if="layerItems.length > 0 && selectedLayerXId && isOperationEnabled('create')"
                    class="mx-2"
                >
                    <template v-if="!layoutsAreHidden">
                        <v-divider class="my-2" />
                        <v-row dense class="justify-space-between">
                            <v-col align-self="center" cols="10" class="text-subtitle-2">
                                {{ $t('mapeditor.Layouts') + ':' }}
                            </v-col>
                            <v-col cols="auto">
                                <v-tooltip bottom>
                                    <template #activator="{ on }">
                                        <gwtk-icon-button
                                            icon="mdi-playlist-edit"
                                            :selected="layoutsEditMode"
                                            v-on="on"
                                            @click="layoutsEditMode = !layoutsEditMode"
                                        />
                                    </template>
                                    <div>
                                        {{ $t("mapeditor.Edition mode") }}
                                    </div>
                                </v-tooltip>
                            </v-col>
                        </v-row>
                        <v-row dense>
                            <gwtk-selectable
                                v-for="item in layouts"
                                :key="item.id"
                                :border="!!item.description&&layoutsEditMode"
                            >
                                <div
                                    class="editor-icon border ma-1 pa-1 d-flex justify-center align-center"
                                    @click="selectLayout(item.id)"
                                >
                                    <v-tooltip v-if="item.description&&item.description.imageSrc" top>
                                        <template #activator="{ on }">
                                            <v-img
                                                :src="item.description.imageSrc"
                                                aspect-ratio="1"
                                                contain
                                                v-on="on"
                                            />
                                        </template>
                                        <div>
                                            {{ item.description.objectDescription.layer }}
                                        </div>
                                    </v-tooltip>
                                    <gwtk-icon
                                        v-else
                                        class="close-icon"
                                        name="close-icon"
                                    />
                                </div>
                            </gwtk-selectable>
                        </v-row>
                    </template>
                </div>
            </div>
        </template>
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkMapEditorWidget.ts"></script>

<style scoped>
    .editor-icon {
        cursor: pointer;
        background-repeat: no-repeat;
        background-position: center;
        width: var(--editor-icon-width);
        height: var(--editor-icon-width);
        text-align: center;
        border: 1px solid var(--v-secondary-base)
    }

    /* .active-layouts-edit {
         background-color:  var(--v-primary-base);
     } */

    .gwtk-actions-buttons {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
    }
</style>