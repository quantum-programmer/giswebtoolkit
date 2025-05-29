<template>
    <v-row
        dense
        no-gutters
        class="mx-2 mb-1"
    >
        <v-col>
            <v-row
                dense
                no-gutters
                style="display: flex;"
                align-content="start"
                :style="tagsContainerStyles"
                :class="tagsContainerClasses"
            >
                <v-col
                    v-for="tag in tags"
                    :key="tag"
                    align-self="center"
                    cols="auto"
                >
                    <v-chip

                        outlined
                        class="map-content-tag-item mt-1"
                        :class="isItemActive( tag )? 'map-content-tag-active' : ''"
                        style="width:fit-content"
                        @click="emitSelected(tag)"
                    >
                        {{ tag }}
                    </v-chip>
                </v-col>
            </v-row>
        </v-col>
        <v-col cols="auto" align-self="start">
            <gwtk-button
                clean
                icon-size="15"
                :selected="expandTags"
                :icon="toggleButtonIcon"
                class="mt-1"
                @click="toggleTags"
            />
        </v-col>
    </v-row>
</template>

<script src="./GwtkTags.ts" />

<style>
    .map-content-tag-item:not(:last-child) {
        margin-right: 5px;
    }

    .v-chip.v-chip--outlined.v-chip.v-chip.map-content-tag-active {
        background-color: var(--v-primary-lighten4) !important;
        color: var(--v-primary-base);
        border-color: var(--v-primary-base);
    }
</style>
