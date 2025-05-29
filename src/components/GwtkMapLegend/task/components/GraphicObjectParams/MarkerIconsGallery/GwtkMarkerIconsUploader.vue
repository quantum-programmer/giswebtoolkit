<template>
    <v-card>
        <v-card-title class="font-weight-medium">
            {{ $t('legend.Image uploading') }}
        </v-card-title>
        <v-card-text class="text-body-2">
            <v-row>
                <v-col>
                    {{ $t('legend.Category') }}
                    <v-select
                        :value="imageCategoryIndex"
                        :items="imageCategories"
                        item-text="name"
                        item-value="id"
                        dense
                        flat
                        hide-details
                        outlined
                        solo
                        @change="changeCategory"
                    />
                </v-col>
            </v-row>
            <v-row>
                <v-col v-if="!imageName">
                    <gwtk-button
                        primary
                        :title="$t('phrases.Select')"
                        icon="mdi-camera"
                        width-available
                        @click="toggleSelect"
                    />
                </v-col>
                <v-col v-else>
                    <v-chip
                        class="gwtk-marker-icons-uploader-filename"
                        close
                        @click:close="closeFile"
                    >
                        <v-icon left>
                            mdi-file-image
                        </v-icon>
                        {{ fileName }}
                    </v-chip>
                </v-col>
            </v-row>
            <v-row v-if="imageName" class="mt-1">
                <v-col>
                    {{ $t('legend.Image title') }}
                    <v-text-field
                        v-model="imageName"
                        outlined
                        dense
                        hide-details
                    />
                </v-col>
            </v-row>
            <v-row v-if="imageBase64.src">
                <v-img
                    :src="imageBase64.src"
                    contain
                    aspect-ratio="0.85"
                />
            </v-row>
        </v-card-text>
        <v-card-actions>
            <v-row dense class="ma-1">
                <gwtk-button
                    primary
                    :title="$t('legend.Upload')"
                    :disabled="!imageBase64.src"
                    @click="toggleUpload"
                >
                    <v-progress-circular
                        v-if="isLoading"
                        size="19"
                        width="2"
                        indeterminate
                    >
                        <gwtk-icon name="mdi-close" size="16" />
                    </v-progress-circular>
                </gwtk-button>
                <v-spacer />
                <gwtk-button
                    secondary
                    :title=" $t('phrases.Cancel')"
                    @click="toggleCancel"
                />
            </v-row>
        </v-card-actions>
    </v-card>
</template>

<script lang="ts" src="./GwtkMarkerIconsUploader.ts" />

<style scoped>
    .gwtk-marker-icons-uploader-filename {
        white-space: normal;
        word-break: break-all;
        height: auto;
        padding: 0.5em 1em;
    }
</style>