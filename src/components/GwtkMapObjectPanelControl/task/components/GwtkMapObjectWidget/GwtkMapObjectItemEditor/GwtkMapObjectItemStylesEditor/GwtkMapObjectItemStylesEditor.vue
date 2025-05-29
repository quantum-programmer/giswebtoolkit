<template>
    <div>
        <v-container>
            <template v-if="hasSld">
                <v-row dense justify="center">
                    <v-img
                        :src="previewImageSrc"
                        class="ma-2 gwtk-preview-image border"
                        @click="openEditGraphicObjectPanel()"
                    />
                </v-row>
                <v-row dense justify="center">
                    <gwtk-button
                        secondary
                        icon="mdi-delete-outline"
                        :title="$t('mapobjectpanel.Remove')"
                        @click="removeMapObjectStyle"
                    />
                </v-row>
            </template>
            <v-row
                v-else
                dense
                justify="center"
            >
                <gwtk-button
                    secondary
                    icon="mdi-plus"
                    :title="$t('mapobjectpanel.Add')"
                    @click="showCreateMapObjectStyleDialog"
                />
            </v-row>
        </v-container>
    </div>
</template>

<script lang="ts" src="./GwtkMapObjectItemStylesEditor.ts" />

<style scoped>
    .gwtk-preview-image {
        max-width: 176px;
        max-height: 176px;
        cursor: pointer;
    }
</style>