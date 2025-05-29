<template>
    <div
        class="gwtk-container-main"
    >
        <gwtk-selectable
            v-for="(item, index) in markerList"
            :key="item.id"
            :border="getItemFlag(index)"
        >
            <v-img
                class="ma-1 border gwtk-container-image"
                :width="24" 
                :height="24"
                :src="getItemSrc(index)"
                @click="selectMarker(index)" 
            />
        </gwtk-selectable>
    </div>
</template>

<script lang="ts" src="./GwtkIconsGallery.ts"></script>

<style scoped>
    .gwtk-container-main {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        max-height: 340px;
        overflow-y: auto;
    }

    .gwtk-container-image {
        cursor: pointer;
        min-width: var(--editor-icon-width);
        max-width: var(--editor-icon-width);
        min-height: var(--editor-icon-width);
        border-style: dashed;
    }
</style>