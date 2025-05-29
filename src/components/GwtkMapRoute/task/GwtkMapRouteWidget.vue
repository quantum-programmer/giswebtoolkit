<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :map-vue="mapVue"
        :description="description"
        :min-height="200"
        class="gwtk-map-route"
    >
        <div
            v-if="!showHistoryPanel && !showDetailPanel"
            class="gwtk-main-container "
        >
            <div>
                <v-container class="pa-0">
                    <v-row no-gutters>
                        <v-progress-linear
                            :active="loadingYmapsScript"
                            indeterminate
                            rounded
                            height="6"
                        />
                    </v-row>
                    <v-row class="pb-0 ma-0 gwtk-map-route-source">
                        <v-col
                            cols="12"
                        >
                            <v-select
                                :items="sourceRoutesList"
                                :value="sourceRoute"
                                :item-text="'text'"
                                :item-value="'value'"
                                :label="$t('route.Routing source')"
                                dense
                                flat
                                outlined
                                hide-details
                                @change="selectSourceRoute"
                            >
                                <template #append-outer>
                                    <v-tooltip bottom>
                                        <template #activator="{ on }">
                                            <gwtk-button
                                                :disabled="!historyList.length"
                                                class="ma-0"
                                                secondary
                                                :selected="false"
                                                icon="search_history"
                                                v-on="on"
                                                @click="showRouteHistoryList()"
                                            />
                                        </template>
                                        <span>{{ $t('route.Route history') }}</span>
                                    </v-tooltip>
                                </template>
                            </v-select>
                        </v-col>
                    </v-row>
                    <v-row class="py-1 ma-0 gwtk-map-route-source">
                        <v-col class=" py-0" cols="11">
                            <v-select
                                :items="typeOfRouteMeasure.list"
                                :value="typeOfRouteMeasureValue"
                                :item-text="'text'"
                                :item-value="'value'"
                                :label="$t('route.Route calculation type')"
                                dense
                                flat
                                outlined
                                hide-details
                                @change="toggleTypeOfRouteMeasure"
                            />
                        </v-col>
                    </v-row>
                    <v-row
                        v-if="isYandexMapRoutes && !apiYandexConnect"
                        no-gutters
                        class="pb-0 mx-2"
                    >
                        <v-col cols="12">
                            <v-row no-gutters>
                                <v-text-field
                                    v-model="keyApiYandexValue"
                                    :label="$t('route.Enter the YandexMaps API key')"
                                    hide-details="true"
                                    class="pt-0"
                                    dense
                                    append-outer-icon="mdi-send"
                                    clear-icon="mdi-close-circle"
                                    clearable
                                    @keydown.enter.prevent="sendKey"
                                    @click:append-outer="sendKey"
                                />
                            </v-row>
                            <v-row
                                v-if="keyApiYandexValue===''"
                                no-gutters
                            >
                                <div>
                                    {{ $t('route.To get the key') }}
                                    <a
                                        href="https://yandex.ru/dev/developer-help/doc/ru/api/auth"
                                        target="_blank"
                                        style="text-decoration: underline !important;"
                                    >
                                        {{ $t('route.follow the link') }}
                                    </a>
                                </div>
                            </v-row>
                        </v-col>
                    </v-row>
                    <v-row
                        v-if="isYandexRouter && !apiYandexRouterConnect"
                        no-gutters
                        class="pb-0 mx-2 pt-2"
                    >
                        <v-col cols="12">
                            <v-row no-gutters>
                                <v-text-field
                                    v-model="keyApiYandexRouterValue"
                                    :label="$t('route.Enter the Yandex Router API key')"
                                    hide-details="true"
                                    class="pt-0"
                                    dense
                                    append-outer-icon="mdi-send"
                                    clear-icon="mdi-close-circle"
                                    clearable
                                    @keydown.enter.prevent="sendKey"
                                    @click:append-outer="sendKey"
                                />
                            </v-row>
                            <v-row
                                v-if="keyApiYandexRouterValue===''"
                                no-gutters
                            >
                                <div>
                                    {{ $t('route.To get the key') }}
                                    <a
                                        href="https://yandex.ru/dev/developer-help/doc/ru/api/auth"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style="text-decoration: underline !important;"
                                    >
                                        {{ $t('route.follow the link') }}
                                    </a>
                                </div>
                            </v-row>
                        </v-col>
                    </v-row>
                </v-container>
                <draggable
                    handle=".gwtk-map-route-handle"
                    :list="routeDescription.getRoutePoints().slice()"
                    class="gwtk-route-list"
                    :style="{ maxHeight: isReducedSizeInterface ? '200px' : '150px' }"
                    @update="updateOrder"
                >
                    <div
                        v-for="(item, index) in routeDescription.getRoutePoints()"
                        :key="index"
                        class="getRoutePoints"
                    >
                        <v-menu
                            :close-on-content-click="true"
                            :close-on-click="true"
                            attach="div.gwtk-main-container div.gwtk-route-list"
                            :min-width="'calc(100% - 110px)'"
                            :nudge-left="'-32px'"
                            open-on-click
                            offset-y
                        >
                            <template #activator="{ on }">
                                <v-text-field
                                    :autofocus="index === focusedRoute"
                                    class="mt-4 mx-2"
                                    outlined
                                    dense
                                    :clearable="!startFindInPointAndSetRoutePoint"
                                    hide-details="auto"
                                    :value="item.name?item.name:getRoutePointCoordinateString(item)"
                                    :label="item.name?getRoutePointCoordinateString(item):undefined"
                                    v-on="on"
                                    @click:clear="setActiveRoutePoint(index)"
                                    @click="setActiveRoutePoint(index)"
                                    @focus="setFocusedRoute(index)"
                                    @blur="setFocusedRoute(-1)"
                                    @change="(value)=>setRoutePoint(index, value, item.name)"
                                    @input="setCoordinateValidFlag(index, false)"
                                >
                                    <template #append>
                                        <v-fade-transition leave-absolute>
                                            <v-progress-circular
                                                v-if="startFindInPointAndSetRoutePoint && index===routeDescription.getActiveRoutePoint()"
                                                size="20"
                                                color="var(--v-primary-base)"
                                                indeterminate
                                            />
                                        </v-fade-transition>
                                    </template>
                                    <template #prepend>
                                        <gwtk-icon
                                            :name="getRoutePointIcon(index)"
                                            :color="index === routeDescription.getActiveRoutePoint()? 'var(--v-primary-base)' : ''"
                                        />
                                    </template>
                                    <template #append-outer>
                                        <gwtk-icon-button
                                            v-if="routeDescription.getRoutePointsCount() > 2"
                                            icon="trash-can"
                                            :icon-size="18"
                                            class="ma-0"
                                            @click="removeRoutePoint(index)"
                                        />
                                        <gwtk-icon-button
                                            class="gwtk-map-route-handle ma-0"
                                            icon="math-equal"
                                            :icon-size="18"
                                            :disabled="routeDescription.hasEmptyPoint"
                                        />
                                    </template>
                                </v-text-field>
                            </template>
                            <v-list>
                                <gwtk-list-item
                                    v-for="(prompItem, prompIndex) in historyPrompList"
                                    :key="'promp_' + prompIndex"
                                    :title="prompItem.name"
                                    :icon="prompItem.name === $t('phrases.My location') ? 'geolocation' : 'mdi-history'"
                                    icon-size="18"
                                    @click="setPrompListValue(prompIndex)"
                                />
                            </v-list>
                        </v-menu>
                    </div>
                </draggable>
                <div class="gwtk-body px-2">
                    <v-row
                        no-gutters
                        class="gwtk-route-button-container my-3"
                    >
                        <v-col cols="auto">
                            <gwtk-button
                                clean
                                secondary
                                :disabled="!isEnoughRoutePoints || !isAllCoordinateValid"
                                icon="mdi-plus"
                                :icon-size="18"
                                :title="$t('route.Add point') "
                                @click="addRoutePoint()"
                            />
                        </v-col>
                        <v-spacer />
                        <v-col cols="auto">
                            <gwtk-button
                                secondary
                                :disabled="clearDisabled"
                                width-available
                                :title="$t('route.Reset')"
                                @click="clearPoints()"
                            />
                        </v-col>
                    </v-row>
                    <v-row
                        v-if="historyList.length"
                        no-gutters
                        class="mt-2 mb-2 gwtk-route-button-container"
                    >
                        <v-col cols="12">
                            <v-divider />
                        </v-col>
                    </v-row>
                    <div
                        v-if="!routeDescription.getIsReady()"
                        class="center"
                    >
                        <v-col
                            cols="auto"
                            class="text--secondary py-0"
                        >
                            {{ $t('route.Route search') + '...' }}
                        </v-col>
                        <v-col cols="auto" class="py-1 d-flex justify-center">
                            <v-progress-circular
                                size="20"
                                width="2"
                                indeterminate
                            />
                        </v-col>
                    </div>
                    <div
                        v-if="routeDescription.getCannotGetRoute()"
                        class="center"
                    >
                        {{ $t('route.No data to build a route') }}
                    </div>
                    <div
                        v-if="routeDescription._routeDetails && arrivalTime"
                        class="gwtk-route-description"
                    >
                        <v-container class="border rounded pa-1  gwtk-route-item-list">
                            <v-row
                                no-gutters
                                class="mb-2 ml-2"
                            >
                                <v-col>
                                    <v-list-item class="gwtk-list-item-route-info px-0">
                                        <v-list-item-title>{{ `${$t('route.Result')}: ${ getTimeAndLengthString() }. &nbsp; ` }}</v-list-item-title>
                                    </v-list-item>
                                </v-col>
                            </v-row>
                            <v-row
                                no-gutters
                                class="ml-2"
                            >
                                <v-col>
                                    <v-list-item class="px-0 gwtk-list-item-custom-height">
                                        <v-list-item-title>{{ `${$t('route.Arrival')} ${arrivalTime?arrivalTime:''}.` }}</v-list-item-title>

                                        <v-list-item-icon v-if="!isYandexRouter" class="ml-0 py-0 align-self-center">
                                            <v-tooltip bottom>
                                                <template #activator="{ on }">
                                                    <v-icon
                                                        color="var(--v-primary-base)"
                                                        v-on="on"
                                                        @click.stop="showRouteDetailList()"
                                                    >
                                                        mdi-information-variant
                                                    </v-icon>
                                                </template>
                                                <div>{{ $t('route.View more details') }}</div>
                                            </v-tooltip>
                                        </v-list-item-icon>
                                    </v-list-item>
                                </v-col>
                            </v-row>
                        </v-container>
                    </div>
                </div>
            </div>
            <div>
                <v-row class="gwtk-map-route-execute">
                    <gwtk-button
                        primary
                        width-available
                        :title="$t('route.Building a route')"
                        :disabled="!isEnoughRoutePoints || !isAllCoordinateValid"
                        @click.stop="buildingRoute"
                    />
                </v-row>
            </div>
        </div>
        <gwtk-map-route-history-widget
            v-if="showHistoryPanel"
            class="gwtk-main-container"
            :set-state="setState"
            :history-list="historyList"
            :source-routes-list="sourceRoutesList"
            :type-of-route-measure-panorama="typeOfRouteMeasurePanorama"
            :type-of-route-measure-yandex="typeOfRouteMeasureYandex"
            :map-vue="mapVue"
        />
        <gwtk-map-route-detail-widget
            v-if="showDetailPanel"
            class="gwtk-main-container"
            :route-description="routeDescription"
            :set-state="setState"
            :map-vue="mapVue"
        />
    </gwtk-task-container-item>
</template>

<script lang="ts" src="./GwtkMapRouteWidget.ts" />

<style scoped>

.gwtk-main-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
}

.gwtk-route-list {
    overflow-y: auto;
}

.gwtk-route-button-container {
    flex: unset;
    height: auto;
}

.gwtk-route-description {
    overflow-y: auto;
}

.gwtk-route-point {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}

.gwtk-route-history-href {
    color: rgba(0, 0, 0, 0.6);
    font-size: 1rem;
    font-weight: 400;
    text-decoration: underline;
}
.gwtk-list-item-route-info {
    color: rgba(0, 0, 0, 0.87);
}

.gwtk-map-route-execute {
    margin: 0.6em 0.6em;
    display: flex;
    justify-content: space-between;
    align-content: flex-end;
}

::v-deep .getRoutePoints .v-text-field--enclosed.v-input--dense:not(.v-text-field--solo).v-text-field--outlined .v-input__prepend-outer{
    margin-bottom: 0;
    margin-top: 0;
}
::v-deep .getRoutePoints .v-text-field--enclosed.v-input--dense:not(.v-text-field--solo).v-text-field--outlined .v-input__append-outer {
    margin-bottom: 0;
    margin-top: 0;
}
::v-deep .container .v-text-field--enclosed.v-input--dense:not(.v-text-field--solo).v-text-field--outlined .v-input__append-outer {
    margin-bottom: 0;
    margin-top: 0;
}
::v-deep .getRoutePoints .v-input {
    align-items: center;
}
::v-deep .container .v-input {
    align-items: center;
}
</style>

<style>

.v-list-item__icon {
    margin: 0;
}
</style>
