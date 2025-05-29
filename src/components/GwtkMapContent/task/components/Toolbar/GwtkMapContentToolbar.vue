<template>
    <v-row>
        <v-col
            cols="auto"
            class="px-1"
            align-self="center"
        >
            <gwtk-menu>
                <template #trigger="{ on, attrs, value }">
                    <gwtk-tool-button
                        secondary
                        icon="mdi-plus"
                        :tooltip-text="$t('mapcontent.Add layer')"
                        :selected="value"
                        v-bind="attrs"
                        v-on="on"
                    />
                </template>
                <v-list>
                    <gwtk-list-item
                        v-for="(item, index) in buttonLayersActions"
                        :key="index"
                        :title="item.text"
                        :icon="item.icon"
                        @click="processItem(item.value)"
                    />
                </v-list>
            </gwtk-menu>
        </v-col>
        <v-col
            class="px-1"
            align-self="center"
        >
            <v-text-field
                :value="getSearchValue()"
                outlined
                hide-details
                dense
                clearable
                :label="$t( 'mapcontent.Layer search' )"
                @input="onInputSearch"
            />
        </v-col>
    </v-row>
</template>

<script lang="ts" src="./GwtkMapContentToolbar.ts" />