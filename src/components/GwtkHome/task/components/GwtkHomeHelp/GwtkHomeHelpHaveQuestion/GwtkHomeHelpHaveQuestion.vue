<template>
    <rgis-page
        :title="$t(subCategory.alias)"
        :color="color"
        @backClicked="$emit('backClick')"
    >
        <v-expansion-panels
            multiple
            class="px-4"
        >
            <gwtk-expansion-panel
                v-for="item in subCategory.filter"
                :key="item.id"
                :title="item.alias"
                class="mt-4"
            >
                <div style="white-space: pre-wrap;" v-text="item.nodes[0]" />
            </gwtk-expansion-panel>
        </v-expansion-panels>
    </rgis-page>
</template>

<script lang="ts" src="./GwtkHomeHelpHaveQuestion.ts" />