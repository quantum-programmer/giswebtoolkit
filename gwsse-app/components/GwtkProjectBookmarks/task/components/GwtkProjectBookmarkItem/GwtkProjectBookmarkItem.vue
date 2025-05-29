<template>
    <v-list-item
        :class="bookmark.isSelected ? 'v-item--active v-list-item--active primary--text bookmark-list-item' : 'bookmark-list-item'"
        @click="setActiveClass"
    >
        <v-list-item-content>
            <v-list-item-title class="mb-2">
                {{ bookmark.title }}
            </v-list-item-title>
            <v-list-item-subtitle>
                {{ bookmark.createTime }}
            </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
            <v-row dense>
                <v-col cols="auto">
                    <v-tooltip bottom>
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                :icon="'mdi-chevron-right'"
                                :icon-size="26"
                                v-on="on"
                                @click.stop="moveToBookmark"
                            />
                        </template>
                        <div>{{ goToTooltip }}</div>
                    </v-tooltip>
                    <v-tooltip bottom>
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                :icon="'share'"
                                :icon-size="18"
                                v-on="on"
                                @click.stop="shareBookmark"
                            />
                        </template>
                        <div>{{ shareTooltip }}</div>
                    </v-tooltip>
                    <v-tooltip
                        v-if="isAuth"
                        bottom
                    >
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                :icon="bookmark.isPublic ? 'visibility-on' : 'visibility-off'"
                                :icon-color="bookmark.isPublic ? ' var(--v-primary-base)' : ''"
                                :icon-size="18"
                                v-on="on"
                                @click.stop="publicBookmark"
                            />
                        </template>
                        <div>{{ publicTooltip }}</div>
                    </v-tooltip>
                    <v-tooltip
                        v-if="isAuth"
                        bottom
                    >
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                :icon="'trash-can'"
                                :icon-size="18"
                                v-on="on"
                                @click.stop="deleteBookmark"
                            />
                        </template>
                        <div>{{ deleteTooltip }}</div>
                    </v-tooltip>
                </v-col>
            </v-row>
        </v-list-item-action>
    </v-list-item>
</template>

<script lang="ts" src="./GwtkProjectBookmarkItem.ts" />

<style scoped>
.bookmark-list-item:before {
    border-radius: 4px !important;
}
</style>