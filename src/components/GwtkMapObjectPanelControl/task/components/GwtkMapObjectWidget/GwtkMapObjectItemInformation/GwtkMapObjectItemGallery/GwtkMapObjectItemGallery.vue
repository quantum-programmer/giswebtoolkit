<template>
    <gwtk-page
        icon="mdi-arrow-left"
        :title="$t('rgis.Documents')"
        class="gwtk-mapobject-gallery"
        @leftButtonClicked="exit()"
    >
        <gwtk-list-item
            class="my-2 gwtk-flex-unset"
            theme="primary"
            :title="mapObjectContent && (mapObjectContent.objectNameBySemantic || mapObjectContent.objectName)"
            title-class="font-weight-bold"
            :subtitle="mapObjectContent ? mapObjectContent.layerName : ''"
            :subtitle-bold="mapObjectContent? mapObjectContent.address : ''"
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
        <v-divider />
        <v-container class="gwtk-mapobject-gallery-container">
            <v-row v-if="objectAllDocuments.length > 0">
                <v-col
                    v-for="(item, index) in requestItems"
                    :key="index"
                    cols="2"
                    class="default-image ma-1 pa-0"
                >
                    <v-sheet
                        v-if="item.src"
                        :style="'background-image: url('+item.src+'); opacity: 0.25;'"
                        class="gwtk-mapobject-gallery-image"
                    />
                    <gwtk-icon
                        v-else
                        name="mdi-file-outline"
                        size="128"
                        style="opacity: 0.25;"
                    />

                    <gwtk-icon-button
                        large
                        class="gwtk-mapobject-gallery-cancel"
                        icon="mdi-close"
                        icon-size="50"
                        @click="item.cancellableRequest.abortXhr"
                    />
                    <v-progress-linear
                        :value="item.progress"
                        height="28px"
                        class="gwtk-mapobject-gallery-progress"
                    >
                        <div class="text-caption">
                            {{ $tc('phrases.Loading') + '...' }}
                        </div>
                    </v-progress-linear>
                </v-col>
                <v-container
                    v-for="documentItem in objectAllDocuments"
                    :key="documentItem.key"
                >
                    <v-row class="pa-2">
                        {{ documentItem.name }}
                    </v-row>
                    <v-row>
                        <v-col
                            v-for="(item, index) in documentItem.itemList"
                            :key="item.value"
                            cols="auto"
                        >
                            <v-card
                                outlined
                                style="width: 148px;"
                            >
                                <v-card-text class="pa-0 align-content-center">
                                    <v-hover v-slot="{ hover }">
                                        <v-sheet
                                            :style="'background-image: url('+(item.preview||'')+');'"
                                            class="gwtk-mapobject-gallery-image mx-auto d-flex justify-center"
                                            style="cursor: pointer;"
                                            @click.stop="item.preview !== undefined? onClickViewFile(item) : (mapObjectContent? mapObjectContent.getFileDownload( item.value ) : ()=>{})"
                                        >
                                            <div
                                                v-show="!item.preview"
                                                style="text-align: center;"
                                                class="text-h6 align-self-center mt-3 font-weight-bold"
                                            >
                                                <gwtk-icon
                                                    name="mdi-file-outline"
                                                    size="128"
                                                    style="position: absolute; top: 0; right: 10px;"
                                                />
                                                {{ getFileExtension(item.value) }}
                                            </div>
                                            <v-overlay
                                                v-show="hover"
                                                absolute
                                                class="mb-8"
                                            >
                                                <gwtk-icon
                                                    v-if="item.preview !== undefined"
                                                    name="visibility-on"
                                                    size="48"
                                                />
                                                <gwtk-icon
                                                    v-else
                                                    name="mdi-download"
                                                    size="48"
                                                />
                                            </v-overlay>
                                        </v-sheet>
                                    </v-hover>
                                </v-card-text>
                                <v-card-title>
                                    <v-row
                                        align-content="center"
                                        style="height: 20px;"
                                    >
                                        <v-col
                                            class="text-caption text--primary px-1"
                                            align-self="center"
                                        >
                                            {{ $t('phrases.File') + ' ' + (index + 1) }}
                                        </v-col>
                                        <v-col
                                            cols="auto"
                                            class="px-0"
                                            align-self="center"
                                        >
                                            <gwtk-menu
                                                v-if="allowEditPhoto"
                                                icon="dots"
                                                icon-color="var(--v-primary-base)"
                                                theme="clean"
                                            >
                                                <v-list>
                                                    <v-list-item @click="updateFileDialog(item.value, item.key)">
                                                        <v-list-item-title>
                                                            {{
                                                                $t('phrases.Replace')
                                                            }}
                                                        </v-list-item-title>
                                                    </v-list-item>
                                                    <v-list-item @click="remove(item.value, item.key)">
                                                        <v-list-item-title>
                                                            {{
                                                                $t('phrases.Remove')
                                                            }}
                                                        </v-list-item-title>
                                                    </v-list-item>
                                                    <v-list-item
                                                        @click="mapObjectContent? mapObjectContent.getFileDownload( item.value ): ()=>{}"
                                                    >
                                                        <v-list-item-title>
                                                            {{
                                                                $t('phrases.Download')
                                                            }}
                                                        </v-list-item-title>
                                                    </v-list-item>
                                                </v-list>
                                            </gwtk-menu>
                                        </v-col>
                                    </v-row>
                                </v-card-title>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-container>
            </v-row>
            <v-card v-else elevation="0">
                <v-card-title>
                    {{ $t('phrases.No documents found') }}
                </v-card-title>
                <v-divider class="mt-4" />
            </v-card>
        </v-container>
    </gwtk-page>
</template>

<script lang="ts" src="./GwtkMapObjectItemGallery.ts" />

<style scoped>
    .gwtk-mapobject-gallery-image {
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        background-color: transparent;
        width: 100%;
        min-height: 128px;
    }

    .gwtk-mapobject-gallery-progress {
        position: absolute;
        bottom: 0;
    }

    .gwtk-mapobject-gallery-cancel {
        opacity: 0.75;
        margin: auto;
        position: absolute;
        right: 42px;
        top: 42px;
    }

    .default-image {
        height: 128px;
        min-width: 128px;
        position: relative;
    }

    .gwtk-mapobject-gallery {
        height: 100%;
    }
    .gwtk-mapobject-gallery-container {
        height: calc(100% - 96px);
        overflow-y: auto;
    }

    .gwtk-title-image {
        position: absolute !important;
        width: auto;
        top: 0.6em;
    }

    .gwtk-panel-title {
        position: absolute !important;
        min-width: 100%;
        bottom: 0;
        height: 28px;
        z-index: 100;
    }

    .theme--dark .gwtk-panel-title {
        background: linear-gradient(
            rgba(0, 0, 0, 0),
            var(--v-secondary-darken1),
            var(--v-secondary-base)
        );
    }

    .theme--light .gwtk-panel-title {
        background: linear-gradient(
            rgba(1, 1, 1, 0),
            var(--v-secondary-lighten5),
            var(--v-secondary-base)
        );
    }
</style>
