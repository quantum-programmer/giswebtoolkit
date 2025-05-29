<template>
    <div class="gwtk-map-object-information">
        <gwtk-page
            icon="mdi-arrow-left"
            :title="$t('phrases.Object information')"
            class="gwtk-object-page"
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
            <div
                v-if="mapObjectContent && mapObject && !showProgressBar"
                class="gwtk-map-object-content"
            >
                <div class="gwtk-relative">
                    <template v-if="galleryImages && galleryImages.length > 0">
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
                        icon="mdi-camera-plus-outline"
                        secondary
                        fab
                        elevation="3"
                        @click="openFileDialog"
                    />
                </div>
                <gwtk-list-item
                    class="my-2 gwtk-flex-unset"
                    theme="primary"
                    :disabled="!mapObjectContent.isValidGisObject"
                    :title="mapObjectContent.objectNameBySemantic || mapObjectContent.objectName"
                    title-class="font-weight-bold"
                    :subtitle="mapObjectContent.layerName"
                    :subtitle-bold="mapObjectContent.address"
                    @title:click="toggleMapObject"
                >
                    <template #right-slot>
                        <v-row justify="space-between">
                            <v-col cols="auto">
                                <v-tooltip
                                    v-if="isEditable"
                                    bottom
                                >
                                    <template #activator="{ on }">
                                        <gwtk-button
                                            secondary
                                            icon="mdi-pencil-outline"
                                            icon-size="18"
                                            v-on="on"
                                            @click.stop="setShowObjectEditing()"
                                        />
                                    </template>
                                    <div>{{ $t('phrases.Edit object') }}</div>
                                </v-tooltip>
                            </v-col>
                            <v-col cols="auto">
                                <v-tooltip v-if="hasDocuments" bottom>
                                    <template #activator="{ on }">
                                        <gwtk-button
                                            secondary
                                            icon="mdi-file-document-multiple-outline"
                                            icon-size="18"
                                            v-on="on"
                                            @click.stop="openGallery"
                                        />
                                    </template>
                                    <div>{{ $t('phrases.Documents') }}</div>
                                </v-tooltip>
                                <v-tooltip
                                    v-if="isGetRouteEnabled"
                                    bottom
                                >
                                    <template #activator="{ on }">
                                        <gwtk-button
                                            secondary
                                            :disabled="!mapObjectContent.isValidGisObject"
                                            icon="route"
                                            icon-size="18"
                                            class="mr-1 ml-1"
                                            v-on="on"
                                            @click.stop="getRoute"
                                        />
                                    </template>
                                    <div>{{ $t('phrases.Get route') }}</div>
                                </v-tooltip>
                                <v-tooltip bottom>
                                    <template #activator="{ on }">
                                        <gwtk-button
                                            secondary
                                            :disabled="!mapObjectContent.isValidGisObject"
                                            selected
                                            icon="geolocation"
                                            icon-size="18"
                                            class="mr-1 ml-1"
                                            v-on="on"
                                            @click.stop="toggleMapObject"
                                        />
                                    </template>
                                    <div>{{ $t('mapcontent.Show object') }}</div>
                                </v-tooltip>
                            </v-col>
                        </v-row>
                    </template>
                </gwtk-list-item>
                <v-container class="pa-0 gwtk-map-object-content-semantics">
                    <template v-if="mapObjectContent.showObjectMainProps">
                        <v-container class="fieldset-divider" />
                        <template v-for="(item, index) in mapObjectContent.objectMainProps">
                            <v-divider
                                v-if="item.show && index !== 0"
                                :key="'div_' + index"
                            />
                            <v-row
                                :key="'div_' + item.name"
                                class="mx-1"
                            >
                                <v-col cols="2" />
                                <v-col
                                    cols="10"
                                    class="px-0"
                                >
                                    <div class="text-subtitle-2 font-weight-bold my-2">
                                        {{ $t(item.name) }}
                                    </div>
                                    <div class="text-body-1 text-wrap my-2">
                                        {{ item.value }}
                                    </div>
                                </v-col>
                            </v-row>
                        </template>
                    </template>
                    <template v-if="mapObjectContent.objectAllSemanticList && mapObjectContent.objectAllSemanticList.length > 0">
                        <v-container class="fieldset-divider" />
                        <template v-for="(semanticItem, semanticItemIndex) in mapObjectContent.objectAllSemanticList">
                            <template v-if="semanticItem.key !== 'docfile'">
                                <v-row
                                    v-for="(item, index) in semanticItem.items"
                                    v-show="item.key!=='docfile' && !item.isDownloadFile"
                                    :key="item.key + semanticItemIndex + index"
                                    class="mx-1"
                                >
                                    <v-col
                                        cols="2"
                                        class="center mt-2"
                                    >
                                        <gwtk-icon
                                            v-if="getIconName(item.key)"
                                            primary
                                            class="gwtk-semantic-image"
                                            :name="getIconName(item.key)"
                                            size="18"
                                        />
                                    </v-col>

                                    <v-col
                                        cols="10"
                                        class="px-0"
                                    >
                                        <div class="text-subtitle-2 font-weight-bold my-2">
                                            {{ item.name }}
                                        </div>
                                        <div class="text-body-1 text-wrap my-2 mr-2">
                                            <v-row justify="space-between">
                                                <v-col cols="auto">
                                                    <a
                                                        v-if="item.isEmailLink"
                                                        :href="'mailto:' + item.value"
                                                        target="_blank"
                                                    >
                                                        {{ item.value }}
                                                    </a>
                                                    <a
                                                        v-else-if="item.isLink"
                                                        :href="item.value"
                                                        target="_blank"
                                                    >
                                                        {{ item.value }}
                                                    </a>
                                                    <a
                                                        v-else-if="item.isDownloadFile"
                                                        @click="mapObjectContent.getFileDownload( item.value )"
                                                    >
                                                        {{ item.downloadFileName }}
                                                    </a>
                                                    <span v-else-if="item.isClassifierType">
                                                        {{ item.text }}
                                                    </span>
                                                    <span
                                                        v-else
                                                        class="gwtk-semantic-value"
                                                    >
                                                        {{ cleanText(item.value) }}
                                                    </span>
                                                </v-col>
                                                <v-col
                                                    v-if="item.isBimSemantic && item.value"
                                                    cols="auto"
                                                >
                                                    <gwtk-button
                                                        class="mt-n2 mr-4 ml-n4"
                                                        secondary
                                                        icon="visibility-on"
                                                        icon-size="18"
                                                        @click="onClickViewBimFile(item)"
                                                    />
                                                </v-col>
                                            </v-row>
                                        </div>
                                    </v-col>
                                </v-row>
                            </template>
                            <v-divider :key="semanticItem.key + 'div' + semanticItemIndex" />
                        </template>
                    </template>
                    <template v-if="externalFunctions.length > 0">
                        <v-container class="fieldset-divider" />
                        <v-expansion-panels
                            multiple
                            :value-comparator="comparator"
                        >
                            <gwtk-expansion-panel
                                v-for="(externalFunction, index) in externalFunctions"
                                :key="index"
                                class="gwtk-test-external-function"
                                :title="externalFunction.text"
                                :hide-actions="externalFunction.contents===null"
                                @click:header="startExternalFunction(externalFunction.id)"
                            >
                                <!-- eslint-disable-next-line vue/no-v-html -->
                                <div v-if="externalFunction.contents !== null" v-html="externalFunction.contents" />
                                <v-row
                                    v-if="isLoading"
                                    no-gutters
                                    dense
                                    align-self="center"
                                    justify="center"
                                >
                                    <v-progress-circular
                                        size="18"
                                        width="2"
                                        indeterminate
                                    />
                                </v-row>
                            </gwtk-expansion-panel>
                        </v-expansion-panels>
                    </template>
                </v-container>
            </div>
            <v-overlay v-else-if="mapObject || showProgressBar">
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
                    />
                </v-row>
            </v-overlay>
            <v-card v-else>
                <v-card-title>
                    {{ $t('phrases.No object has been selected') }}
                </v-card-title>
            </v-card>
        </gwtk-page>
    </div>
</template>

<script lang="ts" src="./GwtkMapObjectItemInformation.ts" />

<style scoped>
    .gwtk-object-page {
        height: 100%;
    }

    .gwtk-relative {
        position: relative;
    }

    .gwtk-flex-unset {
        flex: unset;
    }

    .gwtk-semantic-value {
        white-space: pre-line;
    }

    .gwtk-map-object-information {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
    }

    .gwtk-map-object-content {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .gwtk-map-object-content-semantics {
        flex: 1;
        overflow-y: auto;
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

    .gwtk-semantic-image {
        width: 24px;
        height: 24px;
    }

    .fixed-button {
        width: 42px;
        height: 42px;
        position: absolute;
        bottom: -4px;
        right: 5px;
    }

    .menu-gallery {
        position: absolute !important;
        top: 0.3em;
        right: 0.3em;
        z-index: 100;
    }

    .menu-gallery:hover {
        cursor: pointer;
    }

    .gwtk-carousel-item {
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
        width: 100%;
        height: 100%;
    }

    .gwtk-panel-title {
        position: absolute !important;
        min-width: 100%;
        bottom: 0;
        height: 32px;
        z-index: 100;
    }

    .theme--dark .gwtk-panel-title {
        background: linear-gradient(
            rgba(0, 0, 0, 0),
            var(--v-secondary-darken1),
            var(--v-secondary-darken2)
        );
    }

    .theme--light .gwtk-panel-title {
        background: linear-gradient(
            rgba(1, 1, 1, 0),
            var(--v-secondary-lighten5),
            var(--v-secondary-lighten4)
        );
    }

    .gwtk-expansion-panel-content {
        border-top: 1px solid var(--v-secondary-lighten5);
        overflow-y: auto;
    }
    .v-item-group .gwtk-expansion-panel {
        margin-bottom: 0;
    }
    ::v-deep .v-expansion-panel-header__icon {
        width: calc(40em / 15);
        height: calc(40em / 15);
        padding: calc(0.5em);
        border-radius: var(--border-radius-xs);
        border: calc(1em / 15) solid var(--v-secondary-lighten5);
        box-sizing: border-box;
    }
    ::v-deep .gwtk-expansion-panel-header-title {
        padding-left: 52px;
        color: var(--v-secondary-lighten2);
        font-size: calc(14em / 15);
        font-weight: 700;
        line-height: calc(21em / 15);
    }
</style>
