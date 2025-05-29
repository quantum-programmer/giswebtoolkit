<template>
    <v-overlay
        :value="value"
        v-bind="$attrs"
    >
        <v-row no-gutters dense align="center" justify="center">
            <v-progress-circular
                active
                indeterminate
                size="64"
            >
                <gwtk-icon-button
                    v-if="closeButton!==false"
                    large
                    icon="close-icon"
                    @click="$emit('close')"
                />
            </v-progress-circular>
        </v-row>
    </v-overlay>
</template>

<script lang="ts" src="./GwtkOverlay.ts" />

