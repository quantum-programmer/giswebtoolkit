<template>
    <gwtk-page
        class="gwtk-object-item-editor"
        icon="mdi-arrow-left"
        :title="$t('phrases.Edit object')"
        @leftButtonClicked="exit()"
    >
        <template #afterTitle>
            <div @click.stop="() => {}">
                <v-row
                    justify="end"
                    class="pa-1"
                    :style="(allowAddPhoto && (!galleryImages || galleryImages.length === 0) )? 'margin-right: 50px' : ''"
                >
                    <v-col cols="auto">
                        <v-tooltip bottom>
                            <template #activator="{ on }">
                                <gwtk-button
                                    secondary
                                    :disabled="currentObjectIndex === 0"
                                    icon="mdi-chevron-left"
                                    icon-size="18"
                                    v-on="on"
                                    @click.stop="onClickPrevious"
                                />
                            </template>
                            <div>{{ $t('phrases.Previous') }}</div>
                        </v-tooltip>
                    </v-col>
                    <v-col cols="auto">
                        <v-tooltip bottom>
                            <template #activator="{ on }">
                                <gwtk-button
                                    secondary
                                    :disabled="currentObjectIndex >= foundObjectsNumber - 1"
                                    icon="mdi-chevron-right"
                                    icon-size="18"
                                    v-on="on"
                                    @click.stop="onClickNext"
                                />
                            </template>
                            <div>{{ $t('phrases.Next') }}</div>
                        </v-tooltip>
                    </v-col>
                </v-row>
            </div>
        </template>
        <template v-if="mapObjectContent">
            <div class="gwtk-relative">
                <template v-if="galleryImages && galleryImages.length>0">
                    <v-icon
                        class="menu-gallery"
                        @click="openGallery"
                    >
                        mdi-image-multiple-outline
                    </v-icon>
                    <v-carousel
                        :cycle="false"
                        show-arrows-on-hover
                        hide-delimiters
                        height="200"
                    >
                        <v-carousel-item
                            v-for="(image, i) in galleryImages"
                            :key="i"
                        >
                            <div
                                :style="'background-image:url('+image.src+')'"
                                class="gwtk-carousel-item"
                            />
                            <div class="gwtk-panel-title justify-center">
                                <div class="ml-2 mt-2 text-body-2">
                                    {{ $t('phrases.Image') + ' ' + (i + 1) }}
                                </div>
                            </div>
                        </v-carousel-item>
                    </v-carousel>
                </template>
                <gwtk-icon-button
                    v-if="allowAddPhoto"
                    class="ma-2 fixed-button"
                    :class="isReducedSizeInterface?'my-3':'my-4'"
                    icon="mdi-camera-plus-outline"
                    secondary
                    fab
                    elevation="3"
                    @click="openFileDialog"
                />
            </div>
            <gwtk-list-item
                class="gwtk-flex-unset"
                :class="isReducedSizeInterface?'my-1':'my-2'"
                theme="primary"
                :title="mapObjectContent.objectNameBySemantic || mapObjectContent.objectName"
                title-class="font-weight-bold"
                :subtitle="mapObjectContent.layerName"
                :subtitle-bold="mapObjectContent.address"
                @title:click="toggleMapObject"
            >
                <template #right-slot>
                    <v-tooltip bottom>
                        <template #activator="{ on }">
                            <gwtk-button
                                secondary
                                icon="geolocation"
                                icon-size="18"
                                selected
                                v-on="on"
                                @click.stop="toggleMapObject"
                            />
                        </template>
                        <div>{{ $t('mapcontent.Show object') }}</div>
                    </v-tooltip>
                </template>
            </gwtk-list-item>
            <v-container class="fieldset-divider" />
            <gwtk-tabs
                v-model="editorTabOptions"
                class="pa-2 pb-0"
            >
                <gwtk-tab
                    key="tab_edit_semantic"
                    :title="$t('phrases.Attributes')"
                />
                <gwtk-tab
                    key="tab_edit_metric"
                    :disabled="!mapObjectContent.hasGeometry()"
                    :title="$t('phrases.Geometry')"
                />
                <gwtk-tab
                    key="tab_edit_sld"
                    :title="$t('phrases.Graphic')"
                />
            </gwtk-tabs>
            <v-tabs-items
                :style="{ height: isReducedSizeInterface ? 'calc(100% - 160px)' : 'calc(100% - 224px)' }"
                class="gwtk-tab-items"
                :value="editorTabOptions"
            >
                <v-tab-item
                    value="tab_edit_semantic"
                    :transition="false"
                    class="main-container"
                >
                    <gwtk-map-object-item-semantic-editor
                        :set-state="setState"
                        :map-object-content="mapObjectContent"
                        :semantic-view-flags="semanticViewFlags"
                        :is-reduced-size-interface="isReducedSizeInterface"
                    />
                </v-tab-item>
                <v-tab-item
                    value="tab_edit_metric"
                    :transition="false"
                    class="main-container"
                >
                    <gwtk-map-object-item-metric-editor
                        :set-state="setState"
                        :map-object="mapObjectContent"
                        :coordinate-display-format-value="coordinateDisplayFormatValue"
                        :coordinate-display-format="coordinateDisplayFormat"
                        :is-reduced-size-interface="isReducedSizeInterface"
                    />
                </v-tab-item>
                <v-tab-item
                    value="tab_edit_sld"
                    :transition="false"
                    class="main-container"
                >
                    <gwtk-map-object-item-styles-editor
                        :set-state="setState"
                        :map-object="mapObjectContent"
                        :preview-image-src="previewImageSrc"
                        :map-vue="mapVue"
                    />
                </v-tab-item>
            </v-tabs-items>
            <v-container :align="'center'">
                <v-layout justify-center>
                    <v-spacer />

                    <gwtk-button
                        primary
                        width="35%"
                        :title="$t('phrases.Save')"
                        @click="save"
                    />
                    <v-spacer />
                    <gwtk-button
                        secondary
                        width="35%"
                        :title="$t('phrases.Cancel')"
                        @click="exit()"
                    />
                    <v-spacer />
                </v-layout>
            </v-container>
        </template>
        <v-card v-else>
            <v-card-title>
                {{ $t('phrases.No object has been selected') }}
            </v-card-title>
        </v-card>
        <v-overlay
            :value="showSemanticFileUploadOverlay"
            absolute
            z-index="100"
        >
            <v-row
                no-gutters
                dense
                align="center"
                justify="center"
            >
                <v-progress-circular
                    active
                    indeterminate
                    size="64"
                >
                    <gwtk-icon-button
                        large
                        icon="close-icon"
                        @click="abortFileUpload"
                    />
                </v-progress-circular>
            </v-row>
        </v-overlay>
    </gwtk-page>
</template>

<script lang="ts" src="./GwtkMapObjectItemEditor.ts" />

<style scoped>
.gwtk-object-item-editor {
    height: 100%;
}

.main-container {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
}

.gwtk-relative {
    position: relative;
}

.fixed-button {
    width: var(--v-btn-height--default);
    height: var(--v-btn-height--default);
    position: absolute;
    bottom: -4px;
    right: 5px;
}

.fieldset-divider {
    height: 10px;
    border-bottom: 1px solid;
    border-top: 1px solid;
    padding: 0;
}

.theme--light .fieldset-divider {
    border-color: var(--v-secondary-lighten4);
    background: var(--v-secondary-lighten5);
}

.theme--dark .fieldset-divider {
    border-color: var(--v-secondary-darken2);
    background: var(--v-secondary-darken1);
}

::v-deep .gwtk-page-toolbar {
    height: var(--gwtk-page-toolbar-height) !important;
}
::v-deep .v-toolbar__content {
    height: var(--gwtk-page-toolbar-height) !important;
}

::v-deep .gwtk-relative .fixed-button .v-btn__content>i {
    font-size: var(--v-btn-icon-size) !important;
}
</style>

<style>
.gwtk-tab-items > .v-window__container {
    height: calc(100%);
}
</style>
