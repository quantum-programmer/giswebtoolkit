<template>
    <div>
        <v-row dense class="mx-2 mt-0">
            <v-tooltip bottom align="end">
                <template #activator="{ on }">
                    <gwtk-button
                        primary
                        :title="titleButtonCreate"
                        width-available
                        v-on="on"
                        @click="createDialogOpen=true"
                    />
                </template>
                <span>{{ titleButtonCreate }}</span>
            </v-tooltip>
        </v-row>
        <v-overlay
            :value="createDialogOpen"
            absolute
            opacity=".1"
        >
            <v-card
                class="ma-auto"
                width="300px"
                outlined
                light
            >
                <v-card-title class="py-2 pr-2 pl-4 create-bookmark-title">
                    {{ titleButtonCreate }}
                    <v-spacer />
                    <gwtk-icon-button
                        icon="close-icon"
                        @click="createDialogOpen = false"
                    />
                </v-card-title>
                <v-divider />
                <v-card-text>
                    <v-row dense>
                        <v-text-field
                            v-model="bookmarkNameValue"
                            :label="bookmarkName"
                            required
                            counter
                            maxlength="255"
                            clearable
                        />
                    </v-row>
                </v-card-text>
                <v-card-actions>
                    <gwtk-button
                        primary
                        width="45%"
                        @click="createBookmark()"
                    >
                        {{ $t('phrases.Create') }}
                    </gwtk-button>
                    <v-spacer />
                    <gwtk-button
                        secondary
                        width="45%"
                        @click="closeCreateBookmark()"
                    >
                        {{ $t('phrases.Cancel') }}
                    </gwtk-button>
                </v-card-actions>
            </v-card>
        </v-overlay>
    </div>
</template>

<script lang="ts" src="./GwtkProjectBookmarkAdd.ts" />

<style scoped>
.create-bookmark-title{
    font-size: 1rem;
}
</style>