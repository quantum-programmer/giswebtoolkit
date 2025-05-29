<template>
    <gwtk-expansion-panel
        :title="$t('phrases.List of active services to search')"
    >
        <v-container class="pa-0">
            <v-row dense>
                <v-col>
                    {{ $t('phrases.Active service for searching') }}
                </v-col>
            </v-row>
            <v-row dense>
                <v-col>
                    <v-select
                        :value="activeServicesUrls.active"
                        :items="activeServicesUrls.urlsList"
                        outlined
                        dense
                        hide-details
                        :menu-props="{ bottom: true, offsetY: true }"
                        @change="changeActiveServiceUrl"
                    >
                        <template #selection="{ item }">
                            <div class="v-select__selection v-select__selection--comma text-body-1">
                                {{ item }}
                            </div>
                        </template>
                    </v-select>
                </v-col>
            </v-row>
        </v-container>
    </gwtk-expansion-panel>
</template>

<script lang="ts" src="./GwtkMapOptionsActiveService.ts" />