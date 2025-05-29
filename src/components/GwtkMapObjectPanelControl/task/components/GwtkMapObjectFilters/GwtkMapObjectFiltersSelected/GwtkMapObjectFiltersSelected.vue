<template>
    <v-chip-group class="gwtk-chip-group" show-arrows v-bind="$attrs" v-on="$listeners">
        <gwtk-tooltip
            v-for="(item, index) in selectedFiltersTypes"
            :key="index"
            :text="item.layerNames"
        >
            <template #activator="{ on }">
                <gwtk-chip
                    with-close
                    v-on="on"
                    @close="$emit('deleteSelectedFiltersTypes', item)"
                >
                    {{ formTextValue(item) }}
                </gwtk-chip>
            </template>
        </gwtk-tooltip>
    </v-chip-group>
</template>

<script lang="ts" src="./GwtkMapObjectFiltersSelected.ts" />


<style>
    .gwtk-chip-group .v-slide-group__next,
    .gwtk-chip-group .v-slide-group__prev {
        min-width: auto;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        border-radius: 50%;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s;
        z-index: 100;
    }

    .gwtk-chip-group .v-slide-group__next {
        right: 0;
    }

    .gwtk-chip-group:hover .v-slide-group__next,
    .gwtk-chip-group:hover .v-slide-group__prev {
        opacity: 1;
        pointer-events: all;
    }
    
</style>