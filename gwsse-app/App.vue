<template>
    <v-app
        :class="$vuetify.breakpoint.smAndUp? 'ma-0 pa-0 gwtk-scroll-style-wrapper' : 'ma-0 pa-0'"
        style="width:100%; height:100%;"
    >
        <v-system-bar class="header" height="auto">
            <v-col v-show="$vuetify.breakpoint.smAndUp" class="py-1" cols="0">
                <v-row dense no-gutters>
                    <v-col cols="auto" class="py-1">
                        <v-row dense no-gutters>
                            <v-col>
                                <img :src="logo" alt="logo">
                            </v-col>
                            <v-col align-self="center" class="ml-2 header-app-name">
                                GIS WebServer SE
                            </v-col>
                        </v-row>
                    </v-col>
                    <v-col cols="1" />
                    <v-col v-if="appParams.keyFlag" cols="0" class="py-1 header-project" align-self="center">
                        <v-row v-if="project">
                            <span id="gws_name" class="text-h6 font-weight-bold">{{ project.text }}</span>
                            <v-divider vertical class="mx-2 mt-2" style="height: 20px" />
                            <span id="gws_description" class="text-subtitle-1" style="line-height: 2rem">{{ project.description }}</span>
                        </v-row>
                    </v-col>
                    <v-col
                        v-else
                        cols="0"
                        class="py-1 text-h6"
                        style="color: var(--v-error-base);"
                        align-self="center"
                    >
                        {{ $tc('gwsse.Limited functionality mode') }}
                    </v-col>
                </v-row>
            </v-col>
            <v-col cols="1" />
            <v-col cols="auto" align-self="center">
                <gwtk-left-toolbar
                    ref="leftToolbar"
                    class="pointer-events"
                    :map-vue="mapVue"
                />
            </v-col>
            <v-col cols="auto" class="py-1">
                <v-row dense no-gutters>
                    <span v-if="userName" class="text-h6 header-project user-name">{{ userName }}</span>
                </v-row>
            </v-col>
        </v-system-bar>
        <!--        Главный контейнер c картой-->
        <v-main class="ma-0 pa-0">
            <!--        Панели кнопок-->
            <v-app-bar
                v-show="$vuetify.breakpoint.smAndUp"
                ref="appbar"
                app
                dense
                clipped-left
                elevation="0"
                color="transparent"
                class="app-bar-top pt-2"
            >
                <v-spacer />
                <gwtk-toolbar
                    ref="toolbar"
                    class="gwtk-toolbar-panel pointer-events"
                    :map-vue="mapVue"
                />
            </v-app-bar>

            <gwtk-right-bar
                ref="rightBarPanel"
                :map-vue="mapVue"
            />

            <gwtk-map3d-task-container
                v-if="$vuetify.breakpoint.smAndUp"
                ref="map3dPanel"
                :map-vue="mapVue"
                class="map-3d-panel-main"
            />


            <gwtk-bottom-navigation
                v-show="$vuetify.breakpoint.xsOnly"
                ref="bottomNavigation"
                :map-vue="mapVue"
            />

            <v-container
                v-if="$vuetify.breakpoint.xsOnly"
                style="position: absolute; top:0; left:0; z-index: 2; pointer-events: none;"
            >
                <gwtk-footer-panel
                    ref="gwtkfooterpanel"
                    :map-vue="mapVue"
                />
                <gwtk-top-panel
                    ref="topPanel"
                    :map-vue="mapVue"
                    class="pt-2"
                />
            </v-container>

            <!--        Панели компонентов (виджетов)-->

            <gwtk-task-container
                v-if="$vuetify.breakpoint.smAndUp"
                ref="sidebar"
                :map-vue="mapVue"
                class="gwtk-navigation-drawer rounded-lg"
            />
            <gwtk-swipe-panel v-else>
                <gwtk-task-container
                    ref="sidebar"
                    :map-vue="mapVue"
                    style="position: absolute;top: 36px;bottom: 46px;width: 100%;"
                />
            </gwtk-swipe-panel>

            <gwtk-window ref="windowPanel" :map-vue="mapVue" />


            <div class="gwtk-map-panel" />
            <div
                :id="mapDivId"
                ref="mapDiv"
                class="mapDivId"
            />
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-if="counters" class="counters" v-html="counters" />
            <div v-if="$vuetify.breakpoint.smAndUp" class="header-license">
                <div class="header-license-background" />
                <a
                    href="https://www.gisinfo.ru/products/giswebserverse.htm"
                    class="text-caption font-weight-bold header-license-href"
                >
                    GIS WebServer SE
                    <span>{{ version }}</span>
                </a>
                <a href="https://gisinfo.ru" class="header-license-href text-caption">
                    &copy;<span class="mx-1">{{ new Date().getFullYear().toString() }}</span><span>{{
                        $tc('gwsse.KB Panorama')
                    }}</span>
                </a>
            </div>
            <!--        Нижняя панель-->
            <v-footer
                v-if="$vuetify.breakpoint.smAndUp"
                v-bind="{absolute:true}"
                padless
                color="transparent"
                style="pointer-events: none!important;"
                class="px-1 mb-1"
            >
                <gwtk-footer-panel
                    ref="gwtkfooterpanel"
                    :map-vue="mapVue"
                />
            </v-footer>
            <!--        Панели, отображаемые при определенных условиях-->
            <gwtk-map-window-full-screen
                ref="fullScreenPanel"
                :map-vue="mapVue"
            />

            <gwtk-map-snack-bar ref="snackbar" @openLog="mapVue.getTaskManager().openMapLog()" />

            <gwtk-info-dialog
                ref="info"
                :map-vue="mapVue"
                class="pointer-events"
            />

            <gwtk-input-text-dialog
                ref="inputText"
                :map-vue="mapVue"
                class="pointer-events"
            />

            <gwtk-map-overlay
                ref="overlay"
                :map-vue="mapVue"
            />
        </v-main>

        <div
            style="display: none; position: absolute;" class="gwtk-controls-panel"
        />
        <gwtk-task-bottom-container
            v-if="$vuetify.breakpoint.smAndUp"
            ref="bottomPanel"
            :map-vue="mapVue"
        />
    </v-app>
</template>

<script lang="ts" src="./App.ts">
</script>

<style>
@import url('../src/components/System/Vuetify/base-styles.css');
/*@import url('./components/System/Vuetify/rgis-style.css');*/

@import url('../src/gwtkse.css');


.app-bar-top {
    top: auto !important;
    pointer-events: none;
}

.header {
    background: linear-gradient(180deg, var(--v-primary-lighten3) 0%, #FFFFFF 118.44%);
    border-bottom: 2px solid #3f82a1;

    -webkit-user-select: none; /* Safari */
    user-select: none; /* Standard syntax */

}

.header.v-system-bar--fixed {
    position: static;
}

.header-project {
    color: var(--v-primary-base);
}

.header-app-name {
    font-size: 20px;
    font-weight: bold;
    color: var(--v-secondary-darken1);
    min-width: max-content;
}

.gwtk-navigation-drawer {
    pointer-events: none;
    min-width: 454px;
    max-width: 454px;
    position: absolute;
    top: 1px;
    left: 8px;
    bottom: 46px;
    width: auto;
    z-index: 4;
}

.map-3d-panel-main {
    position: absolute;
    right: 0;
    bottom: 10%;
    z-index: 2;
    pointer-events: none;
}

.gwtk-map-panel {
    width: auto !important;
    height: auto !important;
    overflow: hidden;
}

.gwtk-toolbar-panel {
    max-width: min-content !important;
}

.mapDivId {
    height: 100%;
    width: 100%;
}

.pointer-events {
    pointer-events: auto !important;
}

/* Настройки для узкого скролла */
/* Firefox (any) */
.gwtk-scroll-style-wrapper * {
    scrollbar-width: thin;
}

/* Chrome 28+ (also affects Safari and MS Edge now) */
@supports (-webkit-appearance:none) {
    .gwtk-scroll-style-wrapper * ::-webkit-scrollbar {
        width: 0.5em;
        height: 0.5em;
    }

    .gwtk-scroll-style-wrapper * ::-webkit-scrollbar-track {
        background-color: var(--v-secondary-lighten5);
    }

    .gwtk-scroll-style-wrapper * ::-webkit-scrollbar-thumb {
        background-color: var(--v-secondary-lighten4);
    }
}

.counters {
    min-width: fit-content;
    z-index: 4;
    position: absolute;
    bottom: 0;
    right: 75px;
    font-size: small;
}

.header-license {
    height: 40px;
    min-width: fit-content;
    z-index: 4;
    position: absolute;
    bottom: 0;
    right: 5px;
}

.header-license-background {
    position: absolute;
    background-color: var(--v-primary-lighten4);
    opacity: 0.5;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
}

.v-application a.header-license-href {
    display: block;
    text-decoration: none;
    color: var(--v-secondary-darken4);
}

</style>
