<template>
    <div class="gwtk-category-full-height">
        <v-card
            :color="color"
            elevation="0"
            tile
            class="pa-3 ma-0"
            style="position: fixed; top:0; z-index: 2; width: 100%;"
        >
            <v-list-item class="px-4 py-2" @click="$emit('backClicked')">
                <v-list-item-avatar
                    tile
                    size="20"
                >
                    <v-icon color="white">
                        mdi-arrow-left
                    </v-icon>
                </v-list-item-avatar>
                <v-list-item-title class="white--text">
                    {{ title }}
                </v-list-item-title>
            </v-list-item>
        </v-card>
        <div style="margin-top: 96px;">
            <slot />
        </div>
    </div>
</template>

<script lang="ts" src="./RgisPage.ts"></script>

<style scoped>
    .gwtk-category-full-height {
        min-height: 81%;
    }
</style>