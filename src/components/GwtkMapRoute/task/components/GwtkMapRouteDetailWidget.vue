<template>
    <div class="mx-2">
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
            class="text-body-1 align-center"
        >
            <v-col>
                {{ $t('route.Route description') }}
            </v-col>
            <v-col cols="auto">
                {{ `${getTimeAndLengthString()}.` || $t('route.Route points match') }}
            </v-col>
            <v-tooltip bottom>
                <template #activator="{ on }">
                    <v-col cols="1">
                        <gwtk-icon-button
                            icon="mdi-content-copy"
                            :icon-color="'var(--v-primary-base)'"
                            v-on="on"
                            @click.stop="copyMoveListToClipBoard()"
                        />
                    </v-col>
                </template>
                <div>{{ $t('route.Copy route to clipboard') }}</div>
            </v-tooltip>
        </v-row>
        <v-container class="border rounded pa-0 gwtk-route-item-list">
            <template v-for="(routeDetails, index1) in routeDescription._routeDetails">
                <v-row :key="index1">
                    <gwtk-list-item
                        :title="routeDescription.getRoutePoints()[index1].name"
                        icon="circle-bold"
                        class="text-body-1 mt-2 font-weight-bold gwtk-route-point"
                    />
                </v-row>
                <gwtk-list-item
                    v-for="(item, index2) in routeDetails.detail"
                    :key="index1 + '-' + index2"
                    class="pb-2"
                    :input-value="index1 === routeDescription._activeRouteDetailIndex.index1 && index2 === routeDescription._activeRouteDetailIndex.index2"
                    :icon="turnIconsList[item.code][0]"
                    :title="turnIconsList[item.code][1] + ' ' + item.name"
                    :subtitle="timeAndLengthToString(item.time, item.length)"
                    @click="setActiveDetailItem({index1, index2})"
                />
            </template>
            <gwtk-list-item
                :title="routeDescription.getRoutePoints()[routeDescription.getRoutePoints().length - 1].name"
                icon="map-marker"
                class="text-body-1 font-weight-bold gwtk-route-point"
            />
        </v-container>
    </div>
</template>

<script lang="ts" src="./GwtkMapRouteDetailWidget.ts" />

<style scoped>
.gwtk-page-toolbar.v-sheet {
    cursor: pointer;
}
.gwtk-route-item-list {
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
}

.gwtk-route-point {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}
</style>

