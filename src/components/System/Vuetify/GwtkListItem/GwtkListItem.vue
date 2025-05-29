<template>
    <v-list-item
        class="gwtk-list-item mx-2 px-2"
        :class="{
            'gwtk-list-item-bordered':bordered!==false,
            'v-list-item--active':$attrs.selected,
            [themeClass]:true
        }"
        active-class="gwtk-list-item-selected"
        v-bind="$attrs"
        v-on="$listeners"
    >
        <template #default>
            <v-list-item-icon
                v-if="imgurl||icon"
                class="gwtk-list-item-icon mr-2"
                style="pointer-events: none"
            >
                <v-img
                    v-if="imgurl"
                    :src="imgurl"
                    :width="iconSize"
                    :height="iconSize"
                >
                    <template #placeholder>
                        <v-progress-circular
                            indeterminate
                            color="var(--v-secondary-lighten1)"
                            :size="iconSize/1.5"
                            width="2"
                        />
                    </template>
                </v-img>
                <gwtk-icon
                    v-else
                    :name="icon"
                    :size="iconSize"
                />
            </v-list-item-icon>

            <v-list-item-content class="gwtk-list-item-content">
                <v-row
                    dense
                    align-content="center"
                    style="width: 100%"
                >
                    <v-col
                        v-if="leftSlot"
                        cols="auto"
                        class="gwtk-list-item-left-slot-content mr-1"
                        align-self="center"
                    >
                        <slot name="left-slot" />
                    </v-col>
                    <v-col
                        class="gwtk-list-item-main-slot-content"
                        align-self="center"
                    >
                        <slot v-if="mainSlot" />
                        <template v-else>
                            <v-list-item-title
                                v-if="title"
                                class="gwtk-list-item-main-slot-content-title"
                                :class="titleClass"
                                @click="$emit('title:click')"
                            >
                                {{ title }}
                            </v-list-item-title>
                            <v-list-item-subtitle v-if="subtitle" class="gwtk-list-item-main-slot-content-title">
                                {{ subtitle }}
                            </v-list-item-subtitle>
                            <v-list-item-subtitle
                                v-if="subtitleBold"
                                class="font-weight-bold"
                            >
                                {{ subtitleBold }}
                            </v-list-item-subtitle>
                        </template>
                    </v-col>
                    <v-col
                        v-if="rightSlot"
                        cols="auto"
                        class="gwtk-list-item-right-slot-content"
                        align-self="center"
                    >
                        <slot name="right-slot" />
                    </v-col>
                </v-row>
            </v-list-item-content>
        </template>
    </v-list-item>
</template>

<script lang="ts" src="./GwtkListItem.ts"></script>

<style scoped>

    .gwtk-list-item {
        border-radius: var(--border-radius-s);
        padding-top: var(--space-xs);
        padding-bottom: var(--space-xs);
    }

    .gwtk-list-item-bordered {
        border: 1px solid var(--v-secondary-lighten5);
    }

    .gwtk-list-item-bordered.theme--dark {
        border: 1px solid var(--v-secondary-base);
    }

    .gwtk-list-item-selected {
        box-shadow: var(--v-primary-base) 0 0 0 2px inset;
    }

    .gwtk-list-item.v-list-item--active {
        color: var(--v-primary-base);
    }

    .gwtk-list-item.v-list-item--active.theme--light {
        background-color: var(--v-primary-lighten4);
    }

    .gwtk-list-item.v-list-item--active.theme--dark {
        background-color: var(--v-primary-darken4);
    }

    .gwtk-list-item.v-list-item--active.v-list-item--link:before {
        background-color: unset;
    }

    .gwtk-list-item-icon {
        align-self: auto;
    }

    .gwtk-list-item-content {
        flex-wrap: nowrap;
    }

    .gwtk-list-item-left-slot-content {
        flex: 0 1 auto;
    }

    .gwtk-list-item-main-slot-content {
        flex: 1 1;
        min-width: 60px;
    }

    .gwtk-list-item-main-slot-content-title {
        white-space: normal;
        word-break: break-word;
    }

    .gwtk-list-item-right-slot-content {
        flex: 0 1 auto;
    }

    .list-item-theme-primary.v-list-item:not(.v-list-item--active):not(.v-list-item--disabled) .gwtk-list-item-main-slot-content-title {
        color: var(--v-primary-base);
    }

</style>