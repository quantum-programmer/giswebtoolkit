<template>
    <v-card
        class="gwtk-task-card"
        outlined
        :class="{
            'overflow-x-hidden':$vuetify.breakpoint.xs,
            'gwtk-task-card-title-top-border-radius':windowMode!==false
        }"
        flat
        @mousedown="$emit('mousedown', $event)"
    >
        <v-card-title
            :style="{backgroundColor: titleBackgroundColor}"
            class="gwtk-task-card-title mt-0 pa-0"
        >
            <v-row
                v-if="windowMode!==false"
                dense
                no-gutters
                class="pt-1 pb-2 pl-4 pr-3"
                :style="{color: titleTextColor}"
            >
                <v-col class="text-subtitle-2 gwtk-task-card-title-text text--secondary" align-self="center">
                    {{ title }}
                </v-col>
                <v-col
                    v-if="storedData"
                    cols="auto"
                    :class="isReducedSizeInterface? '' : 'mr-3'"
                >
                    <v-tooltip right>
                        <template #activator="{ on, attrs }">
                            <gwtk-icon-button
                                class="gwtk-task-card-title-button"
                                icon="brush"
                                :icon-size="isReducedSizeInterface ? 20 : 24"
                                :small="isReducedSizeInterface"
                                v-bind="attrs"
                                v-on="on"
                                @click="$emit('clear', $event)"
                                @mousedown.stop
                            />
                        </template>
                        <span>{{ $t('phrases.Clear state') }}</span>
                    </v-tooltip>
                </v-col>
                <v-col
                    v-if="helpPageExists!==false"
                    cols="auto"
                    :class="isReducedSizeInterface? '' : 'mr-3'"
                >
                    <v-tooltip right>
                        <template #activator="{ on, attrs }">
                            <gwtk-icon-button
                                :icon-color="titleTextColor||undefined"
                                class="gwtk-task-card-title-button"
                                icon="mdi-help-circle-outline"
                                :icon-size="isReducedSizeInterface ? 20 : 24"
                                :small="isReducedSizeInterface"
                                v-bind="attrs"
                                v-on="on"
                                @click="$emit('help', $event)"
                            />
                        </template>
                        <span>{{ $t('phrases.Help') }}</span>
                    </v-tooltip>
                </v-col>
                <v-col cols="auto">
                    <gwtk-icon-button
                        :icon-color="titleTextColor||undefined"
                        class="gwtk-task-card-title-button"
                        icon="mdi-close"
                        :icon-size="isReducedSizeInterface ? 20 : 24"
                        :small="isReducedSizeInterface"
                        @click="$emit('close', $event)"
                        @mousedown.stop
                    />
                </v-col>
            </v-row>
            <v-row v-else dense no-gutters class="pt-3 pb-2 pr-3 mb-2">
                <v-col class="gwtk-task-card-title-text">
                    <v-btn
                        :color="titleTextColor||undefined"
                        class="gwtk-test-sideSheetItem-close"
                        :class="$vuetify.breakpoint.xs&&titleTextColor? 'v-btn--active':undefined"
                        plain
                        @click="$emit('close', $event)"
                        @mousedown.stop
                    >
                        <gwtk-icon name="mdi-chevron-left" />
                        {{ title }}
                    </v-btn>
                </v-col>
                <v-col
                    v-if="storedData"
                    cols="auto"
                    :class="isReducedSizeInterface? '' : 'mr-3'"
                >
                    <v-tooltip right>
                        <template #activator="{ on, attrs }">
                            <gwtk-icon-button
                                class="gwtk-task-card-title-button"
                                icon="brush"
                                :icon-size="isReducedSizeInterface ? 20 : 24"
                                :small="isReducedSizeInterface"
                                v-bind="attrs"
                                v-on="on"
                                @click="$emit('clear', $event)"
                                @mousedown.stop
                            />
                        </template>
                        <span>{{ $t('phrases.Clear state') }}</span>
                    </v-tooltip>
                </v-col>
                <v-col
                    v-if="helpPageExists!==false"
                    cols="auto"
                >
                    <v-tooltip right>
                        <template #activator="{ on, attrs }">
                            <gwtk-icon-button
                                class="gwtk-task-card-title-button"
                                icon="mdi-help-circle-outline"
                                :icon-size="isReducedSizeInterface ? 20 : 24"
                                :small="isReducedSizeInterface"
                                v-bind="attrs"
                                v-on="on"
                                @click="$emit('help', $event)"
                                @mousedown.stop
                            />
                        </template>
                        <span>{{ $t('phrases.Help') }}</span>
                    </v-tooltip>
                </v-col>
            </v-row>
        </v-card-title>
        <v-card-text class="gwtk-task-card-text pa-2" :style="{height: isReducedSizeInterface? 'calc(100% - 40px)': 'calc(100% - 64px)' }">
            <slot />
        </v-card-text>
    </v-card>
</template>

<script lang="ts" src="./GwtkTaskCard.ts"></script>

<style scoped>
    .gwtk-task-card {
        max-height: 100%;
        height: 100%;
        overflow-y: auto;
    }

    .gwtk-task-card-title {
        display: flex;
        align-items: center;
        align-content: center;
        height: var(--gwtk-task-card-title-height);
    }

    .gwtk-task-card.v-card.v-sheet > .v-card__title.gwtk-task-card-title {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
    }

    .gwtk-task-card-title-button {
        opacity: 0.75;
    }

    .gwtk-task-card-title-button:hover {
        opacity: unset;
    }

    .theme--light > .gwtk-task-card-title {
        background-color: var(--v-primary-lighten5);
    }

    .theme--dark > .gwtk-task-card-title {
        background-color: var(--v-primary-darken4);
    }

    .gwtk-task-card-title-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-transform: uppercase;
        user-select: none;
        opacity: 1;
    }

    .gwtk-task-card-text {
        overflow-y: auto;
        overflow-x: hidden;
        display: block;
    }

    .v-sheet.v-card.gwtk-task-card {
        border-radius: inherit;

    }

    .v-sheet.v-card.gwtk-task-card-title-top-border-radius {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
    }

</style>
