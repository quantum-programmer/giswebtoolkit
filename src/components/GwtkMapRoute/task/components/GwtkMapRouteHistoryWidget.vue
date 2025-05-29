<template>
    <div class="mx-2">
        <div>
            <v-toolbar
                class="gwtk-page-toolbar"
                flat
                @click="backToRoute()"
            >
                <gwtk-icon
                    class="mr-3"
                    name="mdi-arrow-left"
                    :size="24"
                />
                <span class="text-subtitle-1">
                    {{ $t('route.Building a route') }}
                </span>
                <v-spacer />
            </v-toolbar>
            <v-row
                no-gutters
                dense
                class="text-body-1 align-center"
            >
                <v-col>
                    {{ $t('route.Route history') }}
                </v-col>
            </v-row>
            <v-container
                class="gwtk-map-route-history pa-0"
            >
                <v-list>
                    <template
                        v-for="(history, index) in historyList"
                    >
                        <v-card
                            :key="'card_' + index"
                            elevation="0"
                            outlined
                            class="mb-1"
                        >
                            <v-list-item
                                :key="'start_' + index"
                                dense
                                class="mt-1"         
                            >
                                <v-list-item-icon class="my-auto mr-3">
                                    <gwtk-icon
                                        name="circle-bold"
                                        :size="24"
                                    />
                                </v-list-item-icon>
                                <v-list-item-content class="py-0">
                                    <v-list-item-title>
                                        {{ getRoutePointDescription(history, 'start').sourceRoute }}
                                    </v-list-item-title>
                                    <v-list-item-title>
                                        {{ getRoutePointDescription(history, 'start').title }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle
                                        v-if="getRoutePointDescription(history, 'start').subtitle !== ''"
                                    >
                                        {{ getRoutePointDescription(history, 'start').subtitle }}
                                    </v-list-item-subtitle>
                                </v-list-item-content>
                                <v-list-item-action class="ma-0">
                                    <v-tooltip bottom>
                                        <template #activator="{ on }">
                                            <gwtk-button
                                                secondary
                                                icon="route"
                                                icon-color="var(--v-secondary-lighten1)"
                                                v-on="on"
                                                @click="goToRoute(history)"
                                            />
                                        </template>
                                        <span> {{ $t('route.Go to route') }}</span>
                                    </v-tooltip>
                                </v-list-item-action>
                            </v-list-item>
                            <v-list-item
                                :key="'end_' + index"
                                dense
                                class="mb-1"
                                style="min-height: 50px"
                            >
                                <v-list-item-icon class="my-auto mr-3">
                                    <gwtk-icon
                                        name="map-marker"
                                        :size="24"
                                    />
                                </v-list-item-icon>
                                <v-list-item-content>
                                    <v-list-item-title>
                                        {{ getRoutePointDescription(history, 'end').title }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle
                                        v-if="getRoutePointDescription(history, 'end').subtitle !== ''"
                                    >
                                        {{ getRoutePointDescription(history, 'end').subtitle }}
                                    </v-list-item-subtitle>
                                    <v-list-item-subtitle
                                        v-if="getRoutePointDescription(history, 'end').typeOfRouteMeasure !== ''"
                                    >
                                        {{ getRoutePointDescription(history, 'end').typeOfRouteMeasure + " № " + (historyList.length - index) }}
                                    </v-list-item-subtitle>
                                </v-list-item-content>
                                <v-list-item-action class="ma-0">
                                    <v-tooltip bottom>
                                        <template #activator="{ on }">
                                            <gwtk-button
                                                clean
                                                icon="trash-can"
                                                icon-color="var(--v-secondary-lighten1)"
                                                v-on="on"
                                                @click="deleteRoute(index)"
                                            />
                                        </template>
                                        <span> {{ $t('route.Delete route') }}</span>
                                    </v-tooltip>
                                </v-list-item-action>
                            </v-list-item>
                        </v-card>
                    </template>
                </v-list>
            </v-container>
        </div>
    </div>
</template>

<script lang="ts" src="./GwtkMapRouteHistoryWidget.ts" />

<style scoped>
    .gwtk-page-toolbar.v-sheet {
        cursor: pointer;
    }

    .main-container {
      height: calc(100% - 68px);
      overflow-y: auto;
      overflow-x: hidden;
    }
</style>
