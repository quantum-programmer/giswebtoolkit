<template>
    <div
        v-if="!isOpenSldEditor"
        class="gwtk-main-container"
    >
        <v-container class="gwtk-main-view px-2">
            <v-row>
                <v-col>
                    <span class="text-subtitle-1">
                        {{ $t('mapcontent.Publishing a map') }}
                    </span>
                </v-col>
            </v-row>
            <v-row>
                <v-col class="py-2">
                    <v-text-field
                        :label="$t('mapcontent.Map name')"
                        :value="publishMapObject.publishMapName"
                        outlined
                        dense
                        hide-details
                        clearable
                        @change="changePublishMapName"
                    />
                </v-col>
            </v-row>
            <v-row>
                <v-col
                    v-if="publishMapObject.publishMapScale"
                    class="pt-4 pb-2"
                >
                    <v-text-field
                        :label="$t('mapcontent.Map scale')"
                        :value="publishMapObject.publishMapScale"
                        prefix="1 : "
                        outlined
                        dense
                        hide-details
                        type="number"
                        @change="changePublishMapScale"
                    />
                </v-col>
                <v-col class="pt-4 pb-2">
                    <v-autocomplete
                        :label="$t('mapcontent.Coordinate system')"
                        :items="crsItems"
                        :value="crsItems[0]"
                        item-text="title"
                        item-value="epsg"
                        dense
                        flat
                        outlined
                        hide-details
                        clearable
                        :menu-props="{ contentClass:'gwtk-map-content-input-select' }"
                        @change="changePublishMapCrs"
                    >
                        <template #item="{ item }">
                            <v-tooltip bottom>
                                <template #activator="{ on }">
                                    <div class="v-list-item__content">
                                        <div class="v-list-item__title" v-on="on">
                                            {{ item.title }}
                                        </div>
                                    </div>
                                </template>
                                <div>{{ item.comment }}</div>
                            </v-tooltip>
                        </template>
                    </v-autocomplete>
                </v-col>
            </v-row>
            <v-row v-if="publishMapObject.publishMapExtension !== '*' && publishMapObject.publishMapExtension !== '.zip'">
                <v-col
                    class="py-0"
                    cols="6"
                >
                    {{ $t('mapcontent.XSD schema name') }}
                    <v-select
                        :items="publishMapObject.xsdList.list"
                        :value="publishMapObject.xsdList.list[0]"
                        :item-text="'select'"
                        :item-value="'list'"
                        :disabled="!publishMapObject.xsdList.list.length"
                        dense
                        flat
                        outlined
                        hide-details
                        solo
                        :menu-props="{ contentClass:'gwtk-map-content-input-select' }"
                        @change="selectXsd"
                    />
                </v-col>
                <v-col
                    cols="6"
                    class="d-flex align-self-end py-0"
                >
                    <gwtk-button
                        primary
                        :height="40"
                        :disabled="publishMapObject.xsdList.select !== $t('mapcontent.By template')"
                        :title="$t('mapcontent.Setup template')"
                        @click="openSldEditor"
                    />
                </v-col>
            </v-row>
            <v-row>
                <v-col class="pt-2 pb-0">
                    {{ $t('mapcontent.Virtual folder') }}
                    <v-select
                        :items="publishMapObject.virtualFolderList"
                        :value="publishMapObject.virtualFolderList[0]"
                        :item-text="'alias'"
                        :item-value="'folder'"
                        dense
                        flat
                        hide-details
                        outlined
                        solo
                        return-object
                        @change="selectVirtualFolder"
                    />
                </v-col>
            </v-row>
            <div
                v-if="publishMapObject.uploadProgress > 0 && publishMapObject.uploadProgress < 100"
                class="my-3 py-4 gwtk-parameters-list"
            >
                <v-row>
                    <v-col
                        cols="10"
                        class="py-0 d-flex align-top"
                    >
                        <span>{{ $t('mapcontent.Uploading a file to the server') }}</span>
                    </v-col>
                    <v-col
                        cols="2"
                        class="pa-0 d-flex align-top"
                    >
                        <strong>{{ Math.ceil(publishMapObject.uploadProgress) }}%</strong>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col
                        class="py-0 d-flex align-center"
                        cols="11"
                    >
                        <v-progress-linear
                            height="6"
                            :value="publishMapObject.uploadProgress"
                            rounded
                        />
                    </v-col>
                    <v-col
                        class="pa-0 d-flex align-center"
                        cols="1"
                    >
                        <gwtk-icon-button
                            small
                            icon="mdi-close-circle"
                            @click="abortFileUpload"
                        />
                    </v-col>
                </v-row>
            </div>
            <div
                v-if="publishMapObject.createZipProgress > 0 && publishMapObject.createZipProgress < 100"
                class="my-3 py-4 gwtk-parameters-list"
            >
                <v-row>
                    <v-col
                        cols="10"
                        class="py-0 d-flex align-top"
                    >
                        <span>{{ $t('mapcontent.Creating a zip archive') }}</span>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col
                        class="py-0 d-flex align-center"
                        cols="10"
                    >
                        <v-progress-linear
                            height="6"
                            :value="publishMapObject.createZipProgress"
                            rounded
                        />
                    </v-col>
                    <v-col
                        class="pa-0 d-flex align-center justify-center"
                        cols="2"
                    >
                        <strong>{{ Math.ceil(publishMapObject.createZipProgress) }}%</strong>
                    </v-col>
                </v-row>
                <v-overlay :value="publishMapObject.createZipProgress > 0 && publishMapObject.createZipProgress < 100">
                    <v-progress-circular
                        indeterminate
                        size="64"
                    />
                </v-overlay>
            </div>
            <div
                v-if="publishMapObject.percentCompleted > 0 && publishMapObject.percentCompleted < 100"
                class="my-3 py-4 gwtk-parameters-list"
            >
                <v-row>
                    <v-col
                        cols="8"
                        class="py-0 d-flex align-top"
                    >
                        <span>{{ $t('mapcontent.Publishing a map') }}</span>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col
                        class="py-0 d-flex align-center"
                        cols="10"
                    >
                        <v-progress-linear
                            height="6"
                            :value="publishMapObject.percentCompleted"
                            rounded
                        />
                    </v-col>
                    <v-col
                        class="pa-0 d-flex align-center justify-center"
                        cols="2"
                    >
                        <strong>{{ Math.ceil(publishMapObject.percentCompleted) }}%</strong>
                    </v-col>
                </v-row>
            </div>
            <div
                v-if="publishMapObject.percentCompleted === 100 && !publishMapObject.isPublished"
                class="my-3 py-4 gwtk-parameters-list"
            >
                <v-row>
                    <v-col
                        cols="8"
                        class="py-0 d-flex align-top"
                    >
                        <span>{{ $t('mapcontent.Publishing a map') }}</span>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col
                        class="py-0 d-flex align-center"
                        cols="10"
                    >
                        <v-progress-linear
                            indeterminate
                            height="6"
                            :value="publishMapObject.percentCompleted"
                            rounded
                        />
                    </v-col>
                    <v-col
                        class="pa-0 d-flex align-center justify-center"
                        cols="2"
                    >
                        <strong>{{ Math.ceil(publishMapObject.percentCompleted) }}%</strong>
                    </v-col>
                </v-row>
            </div>
            <div
                v-if="publishMapObject.isPublished && publishMapObject.isReadyCreateThematic"
                class="my-3 py-4 gwtk-parameters-list"
            >
                <v-row>
                    <v-col
                        cols="8"
                        class="text-subtitle-1 py-0"
                    >
                        <span>{{ $t('mapcontent.The map has been published') }}</span>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col class="text-subtitle-2 py-0">
                        <span>{{ publishMapObject.publishedFolder }}</span>
                    </v-col>
                </v-row>
            </div>
            <div
                v-if="!publishMapObject.isReadyCreateThematic"
                class="my-3 py-4 gwtk-parameters-list"
            >
                <v-row>
                    <v-col
                        class="py-0 d-flex align-top"
                    >
                        <span>{{ $t('mapcontent.Applying a customized template to a map') }}</span>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col
                        class="py-0 d-flex align-center"
                    >
                        <v-progress-linear
                            indeterminate
                            height="6"
                            rounded
                        />
                    </v-col>
                </v-row>
            </div>
            <div
                v-if="publishMapObject.uploadProgress === -1"
                class="my-3 py-4 gwtk-parameters-list"
            >
                <v-row>
                    <v-col
                        cols="8"
                        class="text-subtitle-1 py-0 d-flex align-top"
                    >
                        <span>{{ $t('mapcontent.Could not publish map') }}</span>
                    </v-col>
                </v-row>
            </div>
            <v-row v-if="publishMapObject.publishMapFileSize > 0">
                <v-col>
                    <span class="text-subtitle-1">
                        {{ $t('mapcontent.Current file') }}
                    </span>
                </v-col>
            </v-row>
            <v-sheet
                v-if="publishMapObject.publishMapFileSize > 0"
                outlined
                rounded
                class="pa-2"
            >
                <v-container>
                    <v-row v-if="publishMapObject.publishMapClassifier">
                        <v-col
                            cols="6"
                            class="text-subtitle-2 d-flex align-center py-2"
                        >
                            <span>{{ $t('mapcontent.Classifier') }}</span>
                        </v-col>
                        <v-col
                            cols="6"
                            class="text-subtitle-2 d-flex align-center justify-end py-2"
                        >
                            <span>{{ publishMapObject.publishMapClassifier }}</span>
                        </v-col>
                    </v-row>
                    <v-row v-if="publishMapObject.publishMapCrs">
                        <v-col
                            cols="6"
                            class="text-subtitle-2 d-flex align-center py-2"
                        >
                            <span>{{ $t('mapcontent.CRS code') }}</span>
                        </v-col>
                        <v-col
                            cols="6"
                            class="text-subtitle-2 d-flex align-center justify-end py-2"
                        >
                            <span>{{ `EPSG: ${publishMapObject.publishMapCrs}` }}</span>
                        </v-col>
                    </v-row>
                    <v-row v-if="publishMapObject.publishMapObjectsNumber">
                        <v-col
                            cols="6"
                            class="text-subtitle-2 d-flex align-center py-2"
                        >
                            <span>{{ $t('mapcontent.Number of objects') }}</span>
                        </v-col>
                        <v-col
                            cols="6"
                            class="text-subtitle-2 d-flex align-center justify-end py-2"
                        >
                            <span>{{ publishMapObject.publishMapObjectsNumber }}</span>
                        </v-col>
                    </v-row>
                    <v-row v-if="publishMapObject.publishMapFileSize > 0">
                        <v-col
                            cols="6"
                            class="text-subtitle-2 d-flex align-center py-2"
                        >
                            <span>{{ $t('mapcontent.File size (KB)') }}</span>
                        </v-col>
                        <v-col
                            cols="6"
                            class="text-subtitle-2 d-flex align-center justify-end py-2"
                        >
                            <span>{{ publishMapObject.publishMapFileSize }}</span>
                        </v-col>
                    </v-row>
                    <v-row v-if="publishMapObject.publishMapType">
                        <v-col
                            cols="6"
                            class="text-subtitle-2 d-flex align-top py-2"
                        >
                            <span>{{ $t('mapcontent.Type of map') }}</span>
                        </v-col>
                        <v-col
                            cols="6"
                            class="text-subtitle-2 d-flex align-center justify-end text-right py-2"
                        >
                            <span>{{ publishMapObject.publishMapType }}</span>
                        </v-col>
                    </v-row>
                </v-container>
            </v-sheet>
        </v-container>

        <v-row class="gwtk-publish-map-execute">
            <v-row v-if="publishMapObject.publishMapExtension === '.zip'">
                <v-col
                    class="d-flex align-center justify-center"
                    cols="auto"
                >
                    <v-alert
                        class="text-body-2"
                        colored-border
                        type="info"
                        elevation="1"
                        dense
                        border="top"
                        width="99%"
                    >
                        {{ $t('mapcontent.Note If there is no classifier in the user archive, incorrect publication of the map is possible') }}
                    </v-alert>
                </v-col>
            </v-row>
            <gwtk-button
                primary
                width="35%"
                :title="$t('mapcontent.Execute')"
                :disabled="publishMapObject.uploadProgress > 0 || !isSldReady || !publishMapObject.crsList.list.length"
                @click="settingsApply"
            />
            <gwtk-button
                secondary
                width="35%"
                :title="$t('mapcontent.Cancel')"
                @click="changeMode"
            />
        </v-row>
    </div>
    <gwtk-map-content-publish-map-add-sld-scheme
        v-else
        :map-vue="mapVue"
        :set-state="setState"
        :sld-object="sldObject"
        :marker-image-list="markerImageList"
        :map-markers-commands="mapMarkersCommands"
        :marker-category-list="markerCategoryList"
        @close:sldEditor="closeSldEditor"
        @save:sldTemplate="saveSldTemplate"
        @reset:sldTemplate="resetSldTemplate"
    />
</template>

<script src="./GwtkMapContentPublishMap.ts" lang="ts" />

<style scoped>
.gwtk-publish-map-execute {
    margin: 0.6em 0;
    display: flex;
    justify-content: space-between;
    align-content: flex-end;
}

.gwtk-main-view {
    min-height: 440px;
    overflow-y: auto;
    overflow-x: hidden;
}

.gwtk-main-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    padding-bottom: 0.6em;
}

.gwtk-user-map-content-publish-map-filename {
    white-space: normal;
    word-break: break-all;
    height: auto;
    padding: 0.6em 1em;
}

::v-deep .gwtk-publish-map-execute .v-alert__icon {
    align-self: center;
}
</style>


