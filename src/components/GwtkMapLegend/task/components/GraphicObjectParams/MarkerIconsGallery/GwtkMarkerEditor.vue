<template>
    <div class="mb-4">
        <v-row dense>
            <v-col>
                {{ $t('phrases.X offset') }}
                <v-text-field
                    :value="item.markerDescription.refX"
                    type="number"
                    :min="0"
                    :max="item.markerDescription.width"
                    outlined
                    dense
                    hide-details
                    @input="onRefXUpdate"
                />
            </v-col>
        </v-row>
        <v-row dense>
            <v-col>
                {{ $t('phrases.Y offset') }}
                <v-text-field
                    :value="item.markerDescription.refY"
                    type="number"
                    :min="0"
                    :max="item.markerDescription.height"
                    outlined
                    dense
                    hide-details
                    @input="onRefYUpdate"
                />
            </v-col>
        </v-row>
        <v-row>
            <gwtk-marker-icons-gallery
                :marker-image-list="markerImageList"
                :map-markers-commands="mapMarkersCommands"
                :marker-category-list="markerCategoryList"
                @updateImage="onImageUpdate"
                @removeImage="onImageRemove"
                @uploadImage="onImageUpload"
            />
        </v-row>
    </div>
</template>

<script lang="ts" src="./GwtkMarkerEditor.ts"></script>

<style scoped>
    .gwtk-filename-label {
        width: 100%;
        word-break: break-all;
        overflow: hidden;
        justify-content: center;
    }
</style>