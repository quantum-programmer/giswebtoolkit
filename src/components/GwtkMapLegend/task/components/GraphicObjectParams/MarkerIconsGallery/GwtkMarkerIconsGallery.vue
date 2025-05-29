<template>
    <v-container class="gwtk-map-marker-icon-gallery">
        <v-row dense>
            <v-col>
                <v-select
                    v-model="imageCategoryIndex"
                    :items="imageCategories"
                    item-text="name"
                    item-value="id"
                    :disabled="imageCategories.length < 2"
                    dense
                    flat
                    hide-details
                    outlined
                    solo
                    @change="onCategorySelect"
                />
            </v-col>
            <v-col
                v-if="mapMarkersCommands.isSaveImage"
                cols="auto"
            >
                <v-tooltip right>
                    <template #activator="{ on, attrs }">
                        <gwtk-button
                            secondary
                            icon="upload"
                            :icon-size="24"
                            v-bind="attrs"
                            v-on="on"
                            @click="toggleUploadImage"
                        />
                    </template>
                    <span>{{ $t('legend.Upload image') }}</span>
                </v-tooltip>
            </v-col>
            <v-col cols="auto">
                <v-tooltip right>
                    <template #activator="{ on, attrs }">
                        <gwtk-button
                            secondary
                            icon="mdi-palette"
                            v-bind="attrs"
                            v-on="on"
                            @click="openColorPicker"
                        />
                    </template>
                    <span>{{ $t('legend.Default filled icon') }}</span>
                </v-tooltip>
            </v-col>
        </v-row>
        <v-row>
            <v-col
                v-for="index in imagesCountInCurrentCategory"
                :key="index"
                cols="auto"
                class="py-0"
            >
                <gwtk-selectable
                    :border="selectedIndex===index"
                >
                    <v-img
                        :src="getImage(index - 1).image.src"
                        :lazy-src="lazySrc"
                        aspect-ratio="1"
                        class="gwtk-image"
                        @click="onImageSelect(index)"
                    >
                        <template #placeholder>
                            <v-row
                                class="fill-height ma-0"
                                align="center"
                                justify="center"
                            >
                                <v-progress-circular
                                    indeterminate
                                />
                            </v-row>
                        </template>
                        <v-row v-if="(selectedIndex===index)&&(mapMarkersCommands.isDeleteImage===true)">
                            <v-col class="gwtk-image-close-button-col">
                                <gwtk-icon-button
                                    class="gwtk-image-remove-button"
                                    icon="mdi-close"
                                    :icon-size="16"
                                    @click="onImageDelete(index)"
                                />
                            </v-col>
                        </v-row>
                    </v-img>
                </gwtk-selectable>
                <div class="gwtk-image-name">
                    {{ getImage(index - 1).name }}
                </div>
            </v-col>
        </v-row>
        <v-dialog
            v-model="addImageMode"
            persistent
            max-width="20em"
        >
            <gwtk-marker-icons-uploader
                :image-category-index="imageCategoryIndex"
                :image-categories="imageCategories"
                @cancel="addImageMode=false"
                @setCategory="onCategorySelect"
                @uploadImage="value=>$emit('uploadImage', value)"
            />
        </v-dialog>
        <v-dialog
            v-model="colorPickerDialogFlag"
            max-width="320"
        >
            <v-card>
                <v-card-title />
                <v-card-text class="text-body-2">
                    <gwtk-color-editor v-model="fillColorTemp" />
                </v-card-text>
                <v-card-actions>
                    <v-row dense class="ma-1">
                        <gwtk-button
                            primary
                            :title="$t('phrases.Select') "
                            @click="onColorPickerSelect"
                        />
                        <v-spacer />
                        <gwtk-button
                            secondary
                            :title="$t('phrases.Cancel')"
                            @click="onColorPickerCancel"
                        />
                    </v-row>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script lang="ts" src="./GwtkMarkerIconsGallery.ts" />

<style scoped>
    .gwtk-image-name {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: smaller;
        text-align: center;
    }

    .gwtk-image-close-button-col {
        display: flex;
        flex-direction: row-reverse;
    }

    .gwtk-image {
        width: var(--editor-icon-width);
        max-height: var(--editor-icon-width);
    }

    .gwtk-image-remove-button {
        max-width: 1.2em;
        min-width: 1.2em;
        max-height: 1.2em;
        background-color:  var(--v-primary-lighten5);
    }
</style>