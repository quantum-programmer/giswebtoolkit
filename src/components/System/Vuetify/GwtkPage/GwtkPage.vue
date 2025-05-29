<template>
    <v-card
        class="gwtk-page"
        flat
    >
        <v-toolbar
            v-if="!withoutHeader&&withoutHeader!==''"
            class="gwtk-page-toolbar"
            :height="headerHeight"
            dense
            flat
            @click="$emit('leftButtonClicked')"
        >
            <gwtk-icon
                v-if="icon"
                class="mr-3"
                :name="icon"
                :size="18"
            />
            <span class="gwtk-page-toolbar-header">
                {{ title }}
            </span>
            <v-spacer />
            <slot name="afterTitle" />
        </v-toolbar>
        <v-card-text
            class="pa-0"
            :style="contentStyle"
        >
            <slot />
        </v-card-text>
    </v-card>
</template>

<script lang="ts" src="./GwtkPage.ts"></script>

<style scoped>
    .gwtk-page.v-sheet.theme--light {
        border: 1px solid var(--v-secondary-lighten4);
    }

    .gwtk-page.v-sheet.theme--dark {
        border: 1px solid var(--v-secondary-darken4);
    }

    .gwtk-page-toolbar.v-sheet {
        cursor: pointer;
    }

    .gwtk-page-toolbar.v-sheet.theme--light {
        border-bottom: 1px solid var(--v-secondary-lighten4);
    }

    .gwtk-page-toolbar.v-sheet.theme--dark {
        border-bottom: 1px solid var(--v-secondary-darken4);
    }

    .gwtk-page-toolbar-header {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        font-size: 1rem;
        font-weight: normal;
        line-height: 1.75rem;
        letter-spacing: 0.009375em 
    }
</style>