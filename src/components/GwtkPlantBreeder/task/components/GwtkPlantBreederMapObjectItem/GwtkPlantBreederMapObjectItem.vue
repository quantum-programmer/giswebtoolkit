<template>
    <v-card
        class="pa-0"
        :class="selected? 'blue lighten-5' : 'no-focus'"
        :ripple="false"
        flat
        @click="$emit('plantbreeder:select', mapObjectContent.mapObject.guid)"
    >
        <v-row dense justify="space-between">
            <v-col cols="auto">
                <div class="gwtk-picture-container border">
                    <img
                        class="gwtk-picture-icon mb-0"
                        alt=""
                        :src="mapObjectContent.mapObject.mapObjectIconUrl"
                    >
                </div>
            </v-col>
            <v-col cols="7" class="py-1 pr-3">
                <v-list-item-title class="text-subtitle-1 font-weight-bold">
                    {{ mapObjectContent.objectNameBySemantic || mapObjectContent.objectName }}
                </v-list-item-title>
                <v-list-item-subtitle
                    v-if="mapObjectContent.getSemanticValue('Section') !== ''"
                    class="text-body-2"
                >
                    {{ $t('plantbreeder.Plot number') }}: {{ mapObjectContent.getSemanticValue('Section') }}
                </v-list-item-subtitle>
            </v-col>
            <v-col cols="auto">
                <v-row dense>
                    <gwtk-button
                        clean
                        tile
                        class="mx-2 my-4 v-btn--outlined"
                        icon="pencil"
                        icon-size="18"
                        :icon-color="'--color-black'"
                        @click.stop="$emit('plantbreeder:edit', mapObjectContent.mapObject.guid)"
                    />
                </v-row>
            </v-col>
        </v-row>
    </v-card>
</template>

<script lang="ts" src="./GwtkPlantBreederMapObjectItem.ts" />

<style scoped>
    .gwtk-picture-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        margin-left: 2px;
    }

    .gwtk-picture-icon {
        min-width: 32px;
        min-height: 32px;
        max-height: 64px;
        max-width: 64px;
        object-fit: contain;
    }

    .no-focus:focus:before {
        opacity: 0 !important;
    }
</style>