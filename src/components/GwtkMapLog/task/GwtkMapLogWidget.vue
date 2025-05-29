<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
    >
        <v-container class="gwtk-main-container pr-1">
            <v-row class="pt-1 mx-0">
                <v-col cols="auto" class="my-1">
                    <v-row>
                        <gwtk-button
                            secondary
                            :class="countAll<1?'gwtk-secondary-theme--light-disable':''"
                            icon="log-all-list"
                            icon-color="var(--v-secondary-lighten1)"
                            :selected="showAll"
                            :disabled="countAll===0"
                            @click="resetTypeFilter"
                        >
                            <v-badge
                                v-show="countAll > 0"
                                :color="showAll? 'primary':'clean'"
                                :style="showAll? 'z-index: 10':''"
                                bordered
                                :content="countAll"
                                :offset-y="badgeOffsetY"
                            />
                        </gwtk-button>
                        <v-divider
                            class="mx-2 mt-1"
                            inset
                            vertical
                        />
                    </v-row>
                </v-col>
                <v-col cols="auto" class="my-1">
                    <v-row>
                        <gwtk-button
                            secondary
                            :class="countInfo<1?'gwtk-secondary-theme--light-disable':''"
                            icon="mdi-information"
                            :selected="showInfo"
                            :disabled="countInfo===0"
                            @click="setInfoType"
                        >
                            <v-badge
                                v-show="countInfo > 0"
                                :color="showInfo? 'primary':'clean'"
                                :style="showInfo? 'z-index: 10':''"
                                bordered
                                :content="countInfo"
                                :offset-y="badgeOffsetY"
                            />
                        </gwtk-button>
                        <gwtk-button
                            secondary
                            class="mx-1"
                            :class="countError<1?'gwtk-secondary-theme--light-disable':''"
                            icon="mdi-close-circle"
                            icon-color="var(--v-error-base)"
                            :selected="showError"
                            :disabled="countError===0"
                            @click="setErrorType"
                        >
                            <v-badge
                                v-show="countError > 0"
                                :color="showError? 'primary':'clean'"
                                :style="showError? 'z-index: 10':''"
                                bordered
                                :content="countError"
                                :offset-y="badgeOffsetY"
                            />
                        </gwtk-button>
                        <gwtk-button
                            secondary
                            :title="countWarning"
                            :class="countWarning<1?'gwtk-secondary-theme--light-disable':''"
                            icon="mdi-alert"
                            icon-color="var(--v-warning-base)"
                            :selected="showWarning"
                            :disabled="countWarning===0"
                            @click="setWarningType"
                        >
                            <v-badge
                                v-show="countWarning > 0"
                                :color="showWarning? 'primary':'clean'"
                                :style="showWarning? 'z-index: 10':''"
                                bordered
                                :content="countWarning"
                                :offset-y="badgeOffsetY"
                            />
                        </gwtk-button>
                        <gwtk-button
                            secondary
                            class="mx-1"
                            :class="countDebug<1?'gwtk-secondary-theme--light-disable':''"
                            icon="mdi-bug-outline"
                            :selected="showDebug"
                            :disabled="countDebug===0"
                            @click="setDebugType"
                        >
                            <v-badge
                                v-show="countDebug > 0"
                                :color="showDebug? 'primary':'clean'"
                                :style="showDebug? 'z-index: 10':''"
                                bordered
                                :content="countDebug"
                                :offset-y="badgeOffsetY"
                            />
                        </gwtk-button>
                    </v-row>
                </v-col>
                <v-spacer />
                <v-col cols="auto" class="my-1">
                    <v-row>
                        <v-tooltip bottom>
                            <template #activator="{ on }">
                                <gwtk-button
                                    secondary
                                    icon="mdi-cancel"
                                    icon-color="var(--v-secondary-lighten1)"
                                    v-on="on"
                                    @click="clearLog"
                                />
                            </template>
                            <span>{{ clearName }}</span>
                        </v-tooltip>
                        <v-col>
                            <v-spacer />
                        </v-col>
                        <v-tooltip bottom>
                            <template #activator="{ on }">
                                <gwtk-button
                                    secondary
                                    icon="log"
                                    v-on="on"
                                    @click="loadLog"
                                />
                            </template>
                            <span>{{ loadLogName }}</span>
                        </v-tooltip>
                    </v-row>
                </v-col>
                <!--                </v-btn-toggle>-->
            </v-row>
            <v-row class="mx-0">
                <v-divider class="my-3" />
            </v-row>
            <v-row class="gwtk-content mx-0 mt-n2">
                <v-expansion-panels
                    flat
                    accordion
                    class="my-2"
                >
                    <v-expansion-panel
                        v-for="(item, index) in mapProtocolString"
                        :key="index"
                    >
                        <v-expansion-panel-header
                            v-if="item.description !== undefined"
                            class="gwtk-log-expansion-panel"
                            expand-icon="mdi-menu-down"
                        >
                            <v-row
                                dense
                            >
                                <v-col cols="1">
                                    <v-icon :color="item.type">
                                        {{ imageListItem(item.type) }}
                                    </v-icon>
                                </v-col>
                                <v-col cols="10" class="pl-2">
                                    <span class="objectTime"> {{ item.time }} </span> - <span class="object-title">{{
                                        item.text
                                    }}</span>
                                </v-col>
                            </v-row>
                        </v-expansion-panel-header>
                        <v-expansion-panel-content
                            v-if="item.description !== undefined"
                        >
                            {{ item.description }}
                        </v-expansion-panel-content>
                        <v-row
                            v-else
                            :key="index"
                            dense
                        >
                            <v-col cols="1">
                                <v-icon :color="item.type">
                                    {{ imageListItem(item.type) }}
                                </v-icon>
                            </v-col>
                            <v-col cols="11">
                                <span class="objectTime"> {{ item.time }} </span> - <span class="object-title">{{
                                    item.text
                                }}</span>
                            </v-col>
                        </v-row>
                        <v-divider
                            v-if="index < mapProtocolString.length - 1"
                            :key="'divider_'+index"
                        />
                    </v-expansion-panel>
                </v-expansion-panels>
            </v-row>
        </v-container>
    </gwtk-task-container-item>
</template>

<script src="./GwtkMapLogWidget.ts" />

<style scoped>

    .gwtk-main-container {
        height: calc(100% - 4px);
    }

    .gwtk-content {
        max-height: calc(100% - 44px);
        overflow-y: auto;
        overflow-x: hidden;
    }

    @media (max-width: 426px) {
        .gwtk-content {
            max-height: calc(100% - 92px);
        }
    }

    .objectTime {
        color: var(--v-primary-base);
        white-space: normal;
    }

    .object-title {
        white-space: normal;
    }

    .iconMessage {
        size: 8px;
    }

    .btnMessage {
        max-width: 48px;
        min-width: auto;

    }

    .btnMessageLoad {
        position: absolute;
        right: 5px;
        justify-content: left;
        max-width: 48px;
        min-width: auto;

    }

    .btnMessageClear {
        position: absolute;
        right: 65px;
        justify-content: left;
        max-width: 48px;
        min-width: auto;

    }

    .gwtk-log-expansion-panel {
        padding: 3px 3px 0 0;
    }
    .gwtk-secondary-theme--light-disable{
        background-color: var(--v-secondary-lighten5) !important;
    }
</style>