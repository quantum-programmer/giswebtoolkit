<template>
    <v-card
        class="pa-0"
        flat
        :class="selected ? 'blue lighten-5' : 'no-focus'"
        :ripple="false"
        style="height: 44px"
        @click="$emit('permanentApiary:select', record)"
    >
        <v-row dense justify="space-between">
            <v-col cols="10" class="pt-3 px-3">
                <v-list-item-title class="text-subtitle-1 font-weight-bold">
                    {{ recordOrganName }}
                </v-list-item-title>
            </v-col>
            <v-col cols="auto">
                <v-row dense>
                    <gwtk-button
                        clean
                        tile
                        class="mx-2 mt-2 v-btn--outlined"
                        icon="pencil"
                        icon-size="18"
                        :icon-color="'--color-black'"
                        @click.stop="$emit('permanentApiary:edit', record)"
                    />
                </v-row>
            </v-col>
        </v-row>
    </v-card>
</template>

<script lang="ts" src="./GwtkBeekeeperStaticRecordItem.ts" />

<style scoped>
    .no-focus:focus:before {
        opacity: 0 !important;
    }
</style>