<template>
    <VueDraggableResizable
        v-if="value"
        v-show="showItem"
        ref="resizable"
        class-name-resizable="main-bottom-container"
        class="elevation-2"
        :h="expanded? h : 'auto'"
        :w="'auto'"
        :min-height="minHeight"
        :draggable="false"
        :active="true"
        :prevent-deactivation="true"
        :handles="expanded? ['tm'] : []"
        @resizing="onResizing"
    >
        <div>
            <div
                v-if="component"
                class="main-bottom-container"
                :style="{height: expanded? h+'px' : '100%'}"
            >
                <v-row
                    dense
                    no-gutters
                    class="px-2 py-0"
                    :style="{color: component.propsData.titleTextColor || undefined, pointerEvents: expanded? 'all' : 'none', height: '36px'}"
                >
                    <v-col align-self="center">
                        <gwtk-tabs v-model="activeTab">
                            <template v-for="tab in tabs">
                                <gwtk-tab
                                    :key="tab.taskId"
                                    :title="$tc(tab.title)"
                                    :disabled="!expanded"
                                >
                                    <gwtk-icon-button
                                        v-if="tab.closable"
                                        icon="mdi-close"
                                        x-small
                                        icon-size="16"
                                        @click="()=>closeTask(tab.taskId)"
                                        @mousedown.stop
                                    />
                                </gwtk-tab>
                            </template>
                        </gwtk-tabs>
                    </v-col>
                    <v-spacer />
                    <template v-if="expanded">
                        <v-col
                            v-if="component.propsData.description.options.storedData"
                            cols="auto"
                            class="mr-3"
                        >
                            <v-tooltip right>
                                <template #activator="{ on, attrs }">
                                    <gwtk-icon-button
                                        class="gwtk-task-card-title-button"
                                        icon="brush"
                                        :icon-size="isReducedSizeInterface ? 20 : 24"
                                        :small="isReducedSizeInterface"
                                        v-bind="attrs"
                                        v-on="on"
                                        @click="clear"
                                        @mousedown.stop
                                    />
                                </template>
                                <span>{{ $t('phrases.Clear state') }}</span>
                            </v-tooltip>
                        </v-col>
                        <v-col
                            v-if="helpPageExists"
                            cols="auto"
                            align-self="center"
                        >
                            <v-tooltip right>
                                <template #activator="{ on, attrs }">
                                    <gwtk-icon-button
                                        :icon-color=" component.propsData.titleTextColor||undefined"
                                        class="gwtk-task-card-title-button"
                                        icon="mdi-help-circle-outline"
                                        :icon-size="isReducedSizeInterface ? 20 : 24"
                                        :small="isReducedSizeInterface"
                                        v-bind="attrs"
                                        v-on="on"
                                        @click="openHelp"
                                    />
                                </template>
                                <span>{{ $t('phrases.Help') }}</span>
                            </v-tooltip>
                        </v-col>
                    </template>
                    <v-col
                        cols="auto"
                        class="ml-3"
                        align-self="center"
                    >
                        <v-tooltip left>
                            <template #activator="{ on }">
                                <gwtk-icon-button
                                    secondary
                                    style="pointer-events: all"
                                    :icon="expanded? 'mdi-chevron-double-down':'mdi-chevron-double-up'"
                                    :icon-size="isReducedSizeInterface ? 20 : 24"
                                    :small="isReducedSizeInterface"
                                    v-on="on"
                                    @click.stop="togglePanel(!expanded)"
                                />
                            </template>
                            <div>{{ expanded ? $t('phrases.Collapse all') : $t('phrases.Expand all') }}</div>
                        </v-tooltip>
                    </v-col>
                </v-row>
                <component
                    :is="component.name"
                    v-show="expanded"
                    :key="component.name"
                    style="height: calc(100% - 36px)"
                    v-bind="{...component.propsData, mapVue}"
                />
            </div>
        </div>
    </VueDraggableResizable>
</template>

<script lang="ts" src="./GwtkTaskBottomContainer.ts" />

<style scoped>
    .main-bottom-container {
        position: relative;
        width: 100%;
        z-index: 5 !important;

        border: none;
        pointer-events: all;
    }

    .gwtk-bottom-panel-button {
        text-align: center;
        pointer-events: all;
        width: 54px;
        height: 25px;
        position: absolute;
        left: 50%;
        transform: translate(50%, -100%);
        border-top-right-radius: 8px;
        border-top-left-radius: 8px;
        border-bottom: none;
        cursor: pointer;
    }
</style>

<style>
    .main-bottom-container > .handle-tm {
        position: absolute;
        z-index: 6;
        width: 97%;
        height: 8px;
        left: 0;
        top: -4px;
        opacity: 0;
        /*background-color: var(--v-secondary-base);*/
    }
</style>
