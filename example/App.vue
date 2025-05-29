<template>
    <v-app
        :class="$vuetify.breakpoint.smAndUp? 'ma-0 pa-0 gwtk-scroll-style-wrapper' : 'ma-0 pa-0 '"
        style="width:100%; height:100%"
    >
        <!--        Панели кнопок-->
        <v-app-bar
            v-show="$vuetify.breakpoint.smAndUp"
            ref="appbar"
            app
            dense
            clipped-left
            elevation="0"
            color="transparent"
            class="app-bar-top"
        >
            <gwtk-left-toolbar
                ref="leftToolbar"
                class="pointer-events"
                :map-vue="mapVue"
            />
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

        <!--        Главный контейнер c картой-->
        <v-main class="ma-0 pa-0">
            <div class="gwtk-map-panel" />
            <div
                :id="mapDivId"
                ref="mapDiv"
                class="mapDivId"
            />
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

            <gwtk-map-snack-bar ref="snackbar" />

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
        top: 10%;
        z-index: 2;
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

</style>
