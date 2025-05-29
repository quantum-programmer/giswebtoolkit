<template>
    <gwtk-window-item
        :task-id="taskId"
        :description="description"
        :min-width="640"
        :min-height="576"
        :map-vue="mapVue"
    >
        <div
            :style="(isBIMMode? 'height: 100%;': 'height: 1px;') + 'min-width: 1px; min-height: 1px;'"
        >
            <div v-show="!uploadFileMode" class="mb-6">
                <v-row v-if="objects.length === 0">
                    <v-col>
                        <gwtk-button
                            class="my-1 gwtk-flex-unset"
                            secondary
                            width-available
                            :title="$t('documentviewer.Load object')"
                            icon="mdi-plus"
                            @click="onClickFileInputButton()"
                        />
                    </v-col>
                </v-row>
                <v-row v-else>
                    <v-tabs
                        fixed-tabs
                        :value="activeObject"
                        @change="onChangeTabs"
                    >
                        <v-tab
                            v-for="(object, i) in objects"
                            :key="i"
                        >
                            <v-col style="text-overflow: ellipsis;  white-space: nowrap; overflow: hidden;">
                                {{ object.name }}
                            </v-col>
                            <v-col cols="auto">
                                <gwtk-icon-button
                                    small
                                    icon="mdi-close"
                                    @click.stop="deleteObject(i)"
                                />
                            </v-col>
                        </v-tab>
                        <v-col>
                            <gwtk-icon-button
                                icon="mdi-plus"
                                @click="onClickFileInputButton()"
                            />
                        </v-col>
                    </v-tabs>
                </v-row>
            </div>
            <v-row
                v-show="isBIMMode"
                class="pa-0 pt-0"
                :style="(uploadFileMode? 'height: 100%' : 'height: calc(100% - 60px); margin-top: 10px;')"
            >
                <v-col
                    ref="viewerComponent"
                    style="position: relative; height: 100%;"
                    :cols="(objects[activeObject] && treePanelOpen)? '8' : ''"
                    class="pa-0"
                >
                    <div
                        ref="bimcanvas"
                        style="height: 100%; min-width: 1px; min-height: 1px;"
                        @mousedown="onMouseDown"
                        @mouseup="onMouseUp"
                    />
                    <gwtk-icon-button
                        v-show="!uploadFileMode"
                        :icon-size="32"
                        icon="mdi-cube-scan"
                        icon-color="var(--v-primary-lighten1)"
                        class="mr-2"
                        style="position: absolute; bottom: 30px; right: 30px;"
                        @click.stop="resetCameraPosition()"
                    />
                    <gwtk-icon-button
                        v-show="!uploadFileMode"
                        secondary
                        :icon="treePanelOpen? 'mdi-menu-right-outline' : 'mdi-menu-left-outline'"
                        class="mr-1"
                        style="position: absolute; bottom: 45%; right: 0;"
                        @click.stop="onChangeOpenTree()"
                    />
                </v-col>
                <v-scroll-x-transition>
                    <v-col
                        v-show="isBIMMode"
                        v-if="objects[activeObject] && treePanelOpen"
                        cols="4"
                        class="pa-0"
                        style="height: 100%;"
                    >
                        <v-card
                            flat
                            outlined
                            style="height: 100%;"
                            class="ma-0 pa-0"
                        >
                            <v-card-title class="bim-tree-card-title">
                                <v-row
                                    justify="space-between"
                                    class="text-body-1"
                                >
                                    <v-col>
                                        {{
                                            showInformation ? $t('documentviewer.Object property') : $t('documentviewer.Object elements')
                                        }}
                                    </v-col>
                                    <v-col cols="2">
                                        <gwtk-icon-button
                                            icon="mdi-file-tree"
                                            :icon-color="!showInformation? 'var(--v-primary-lighten1)' : ''"
                                            class="mr-2"
                                            @click.stop="showInformation=false"
                                        />
                                    </v-col>
                                    <v-col cols="2">
                                        <gwtk-icon-button
                                            :disabled="!selectedElement"
                                            icon="mdi-information-outline"
                                            :icon-color="showInformation? 'var(--v-primary-lighten1)' : ''"
                                            class="mr-2"
                                            @click.stop="showInformation=true"
                                        />
                                    </v-col>
                                </v-row>
                            </v-card-title>
                            <v-card-text
                                class="pa-0 ma-0"
                                style="max-height:calc(100% - 68px); overflow-y: auto;"
                            >
                                <v-treeview
                                    v-show="!showInformation"
                                    dense
                                    hoverable
                                    return-object
                                    :items="objects[activeObject].layers"
                                    :item-key="'expressID'"
                                    multiple-active
                                    :active="highlightNodeList"
                                >
                                    <template #label="{ item }">
                                        <v-tooltip bottom>
                                            <template #activator="{ on, attrs }">
                                                <div
                                                    v-bind="attrs"
                                                    :style="'cursor: pointer; text-overflow: ellipsis; overflow: hidden;'"
                                                    v-on="on"
                                                    @click="onElementMouseClick(item)"
                                                >
                                                    {{ item.name }}
                                                </div>
                                            </template>
                                            <span>
                                                {{ item.name }}
                                            </span>
                                        </v-tooltip>
                                    </template>
                                    <template #prepend="{ item }">
                                        <v-checkbox
                                            v-model="item.visible"
                                            @change="toggleLayerVisible(item)"
                                        />
                                    </template>
                                </v-treeview>
                                <div v-show="showInformation">
                                    <v-expansion-panels
                                        v-if="semanticData.length > 0 && highlightNodeList.length > 0"
                                        multiple
                                        flat
                                        accordion
                                    >
                                        <v-expansion-panel
                                            v-for="(semantic, i) in semanticData"
                                            v-show="semantic.value.length > 1"
                                            :key="i"
                                        >
                                            <v-divider />
                                            <v-expansion-panel-header hide-actions>
                                                {{ semantic.name || $t('documentviewer.Untitled') }}
                                            </v-expansion-panel-header>
                                            <v-divider />
                                            <v-expansion-panel-content>
                                                <div
                                                    v-for="(element, j) in semantic.value"
                                                    v-show="checkElement(element)"
                                                    :key="j"
                                                    class="ml-8"
                                                >
                                                    <v-row class="mb-1 mt-1">
                                                        <v-col class="font-weight-bold">
                                                            {{
                                                                getItemKey(element.key) || $t('documentviewer.Untitled')
                                                            }}
                                                        </v-col>
                                                        <v-col style="word-break: break-all;">
                                                            {{ element.value || $t('documentviewer.Untitled') }}
                                                        </v-col>
                                                    </v-row>
                                                    <v-divider v-if="j < semantic.value.length - 1" />
                                                </div>
                                            </v-expansion-panel-content>
                                        </v-expansion-panel>
                                    </v-expansion-panels>
                                    <div
                                        v-else-if="selectedElement"
                                        class="pa-4"
                                    >
                                        {{ $t('documentviewer.No information') }}
                                    </div>
                                    <div
                                        v-else
                                        class="pa-4"
                                    >
                                        {{ $t('documentviewer.No element') }}
                                    </div>
                                </div>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-scroll-x-transition>
            </v-row>
            <v-row
                v-if="uploadFileMode"
                justify="space-between"
                style="position: fixed; bottom: 50px; left: 50px; right: 50px;"
            >
                <v-spacer />
                <gwtk-button
                    primary
                    width="200px"
                    :title="$t('phrases.Save')"
                    @click="onClickSubmit()"
                />
                <v-spacer />
                <gwtk-button
                    secondary
                    width="200px"
                    :title="$t('phrases.Cancel')"
                    @click="onClickCancel()"
                />
                <v-spacer />
            </v-row>
            <v-overlay
                :value="showLoadingOverlay"
                :absolute="showLoadingOverlay"
                z-index="100"
            >
                <v-row
                    no-gutters
                    dense
                    align-self="center"
                    justify="center"
                >
                    <v-progress-circular
                        :active="showLoadingOverlay"
                        indeterminate
                        size="64"
                    />
                </v-row>
            </v-overlay>
        </div>
        <div
            v-show="isImageMode"
            style="display: flex; justify-content: center; width: 100%; height: calc(100% - 60px); margin-top: 55px;"
        >
            <img
                style="display: block; margin: auto; max-width: 100%; max-height: 100%"
                :src="selectedMediaSrc"
            >
        </div>
        <div
            v-show="isVideoMode"
            style="display: flex; justify-content: center; width: 100%; height: calc(100% - 60px); margin-top: 55px;"
        >
            <video
                style="display: block; margin: auto; max-width: 100%; max-height: 100%"
                :src="selectedMediaSrc"
                controls="controls"
            />
        </div>
    </gwtk-window-item>
</template>

<script src="./GwtkDocumentViewerWidget.ts" />

<style scoped>
    .theme--light .gwtk-fill > * {
        background-color: var(--v-primary-lighten3) !important;
    }

    .theme--dark .gwtk-fill > * {
        background-color: var(--v-primary-darken3) !important;
    }

    .theme--light > .bim-tree-card-title {
        background-color: var(--v-primary-lighten5);
    }

    .theme--dark > .bim-tree-card-title {
        background-color: var(--v-primary-darken4);
    }
</style>
