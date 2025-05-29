<template>
    <v-card
        flat
        height="100%"
    >
        <v-container
            :style="{height: containerHeight}"
            class="pa-1 bookmarks-list-container"
        >
            <v-virtual-scroll
                :items="bookmarksList"
                item-height="68px"
                class="bookmarks-list-virtual-scroll"
            >
                <template #default="{ item }">
                    <gwtk-project-bookmark-item
                        :set-state="setState"
                        :bookmark="item"
                        :is-auth="isAuth"
                        :map-vue="mapVue"
                    />
                </template>
            </v-virtual-scroll>
        </v-container>
        <v-card-actions
            v-if="!isTotalExactly"
            class="pa-0 mt-1 mb-1"
        >
            <v-spacer />
            <gwtk-button
                secondary
                :title="$t('phrases.Load more')"
                @click="getNextPortion()"
            />
            <v-spacer />
        </v-card-actions>
    </v-card>
</template>

<script lang="ts" src="./GwtkProjectBookmarksList.ts" />

<style scoped>
.bookmarks-list-container {
    overflow-y: auto;
}
.bookmarks-list-virtual-scroll {
    height: 100%;
}
</style>