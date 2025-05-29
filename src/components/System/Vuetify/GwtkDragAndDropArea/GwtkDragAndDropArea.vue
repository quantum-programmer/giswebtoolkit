<template>
    <v-card
        class="d-flex flex-column justify-space-around grey lighten-2"
        rounded="md"
        height="100%"
        outlined
        @drop.prevent="$emit('onDrop', $event)"
    >
        <v-card-text class="pa-1 pointer-none">
            <v-row
                class="d-flex flex-column"
                dense
                outlined
                align="center"
                justify="center"
            >
                <v-icon
                    class="mt-5 dragover-icon"
                    size="30"
                >
                    mdi-map-plus
                </v-icon>
                <span class="mt-3">{{ $t('phrases.Drag and drop the map files here to publish') }}</span>
            </v-row>
        </v-card-text>
    </v-card>
</template>
<script lang="ts" src="./GwtkDragAndDropArea.ts"></script>

<style scoped>
    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.3);
        }
        100% {
            transform: scale(1);
        }
    }

    .dragover-icon {
        animation: pulse 1s infinite;
    }

    .pointer-none{
        pointer-events: none;
    }
</style>
