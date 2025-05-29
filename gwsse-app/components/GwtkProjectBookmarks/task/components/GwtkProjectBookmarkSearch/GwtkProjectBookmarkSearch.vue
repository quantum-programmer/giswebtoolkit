<template>
    <v-row dense class="mx-2">
        <v-col cols="12">
            <v-text-field
                v-model="bookmarksSearchValue"
                :placeholder="$t('phrases.Value')"
                dense
                paused
                outlined
                clearable
                hide-details
            >
                <template #append>
                    <gwtk-icon
                        name="search"
                    />
                </template>
            </v-text-field>
        </v-col>
    </v-row>
</template>

<script lang="ts" src="./GwtkProjectBookmarkSearch.ts" />

<style scoped>

</style>