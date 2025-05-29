<template>
    <gwtk-window-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        :min-height="451"
        :min-width="397"
    >
        <template v-if="!isFreeFlightStarted">
            <v-row class="py-2 align-center">
                <v-col cols="auto">
                    <v-tooltip left bottom>
                        <template #activator="{ on }">
                            <gwtk-button
                                secondary
                                icon="plus"
                                v-on="on"
                                @click="openFile"
                            />
                        </template>
                        <div>{{ $t('phrases.Add flying route') }}</div>
                    </v-tooltip>
                </v-col>
                <v-col class="pl-0">
                    <v-text-field
                        outlined
                        hide-details
                        dense
                        clearable
                        :label="$t( 'phrases.Search' )"
                        @input="onInputSearch"
                    />
                </v-col>
            </v-row>
            <div class="gwtk-flight-control-panel">
                <v-list>
                    <template v-for="(item,index) in routeList">
                        <gwtk-list-item
                            :key="'listItem'+item.id"
                            :title="item.alias"
                            :subtitle="item.description"
                            :selected="activeItemId===item.id"
                            @click="toggleRouteItem(item.id)"
                        />
                        <v-divider
                            :key="index"
                        />
                    </template>
                </v-list>
            </div>
            <v-row class="pt-4">
                <v-col class="pl-8">
                    <gwtk-button
                        primary
                        :title="$t('phrases.Execute')"
                        :disabled="!activeItemId"
                        width-available
                        @click="toggleExecute"
                    />
                </v-col>
                <v-col class="pr-8">
                    <gwtk-button
                        secondary
                        :title="$t('phrases.Cancel')"
                        width-available
                        @click="toggleCancel"
                    />
                </v-col>
            </v-row>
        </template>
        <template v-else>
            <div class="gwtk-flight-control-panel">
                <v-card-title>
                    <v-row class="pl-4" style="width:100%">
                        {{ $t('phrases.Flight route') + ': ' }}
                    </v-row>
                    <v-row class="pl-4">
                        {{ activeRouteItemTitle }}
                    </v-row>
                </v-card-title>
                <div class="mt-4 ml-4">
                    {{ $t('phrases.Flight speed') }}
                </div>
                <v-slider
                    v-model="speedIndex"
                    :tick-labels="tickLabels"
                    :max="6"
                    step="1"
                    show-ticks="always"
                    tick-size="7"
                    class="px-3"
                    @change="updateSpeed"
                />
                <v-checkbox
                    class="pl-4 pt-3"
                    dense
                    :input-value="isLoopRoute"
                    :disabled="!activeItemId"
                    :label="$t('phrases.Loop route')"
                    @change="toggleLoopRoute"
                />
            </div>
            <v-col class="px-5 pt-6">
                <gwtk-button
                    secondary
                    :title="$t('phrases.Start over')"
                    width-available
                    @click="toggleStartOver"
                >
                    <div>
                        <v-icon class="pl-1">
                            mdi-restart
                        </v-icon>
                    </div>
                </gwtk-button>
            </v-col>
            <v-row>
                <v-col class="pl-8">
                    <gwtk-button
                        :primary="isFlightPaused"
                        :secondary="!isFlightPaused"
                        :title="$t(pauseButtonTooltip)"
                        width-available
                        @click="togglePause"
                    >
                        <div>
                            <v-icon class="pl-1">
                                {{ isFlightPaused ? 'mdi-play' : 'mdi-pause' }}
                            </v-icon>
                        </div>
                    </gwtk-button>
                </v-col>
                <v-col class="pr-8">
                    <gwtk-button
                        secondary
                        :title="$t('phrases.Finish')"
                        width-available
                        @click="toggleFinish"
                    />
                </v-col>
            </v-row>
        </template>
    </gwtk-window-item>
</template>

<script lang="ts" src="./GwtkFreeFlightWidget.ts" />

<style scoped>
    .gwtk-flight-control-panel {
        min-height: 16em;
        height: calc(100% - 9em);
        overflow-y: auto;
        overflow-x: hidden;
    }
</style>