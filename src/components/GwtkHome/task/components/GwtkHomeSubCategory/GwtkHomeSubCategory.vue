<template>
    <rgis-page
        :title="subCategory.alias"
        :color="color"
        @backClicked="$emit('backClick')"
    >
        <v-list style="overflow-y: auto;" class="pa-0">
            <v-list-item
                @click="toggleAllHandler"
            >
                <v-spacer />
                <v-list-item-action>
                    <v-btn plain
                           color="var(--v-secondary-lighten1)"
                    >
                        <gwtk-icon :name="selectAllMode? 'mdi-playlist-check' : 'mdi-playlist-remove'" />
                    </v-btn>
                </v-list-item-action>
            </v-list-item>
            <v-divider
                class="mx-4"
            />
            <template
                v-for="(item, index) in subCategory.filter"
            >
                <v-list-item
                    :key="index"
                    class="py-1"
                >
                    <v-list-item-title>{{ item.alias }}</v-list-item-title>
                    <v-switch
                        :input-value="item.selected"
                        :ripple="false"
                        @change="changeHandler({id:subCategory.id,itemId:item.id})"
                    />
                </v-list-item>
                <v-divider
                    :key="item.id"
                    class="mx-4"
                />
            </template>
        </v-list>
    </rgis-page>
</template>

<script lang="ts" src="./GwtkHomeSubCategory.ts" />