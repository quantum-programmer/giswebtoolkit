<template>
    <rgis-page
        :title="$t(category.alias)"
        :color="category.color"
        @backClicked="backClickHandler"
    >
        <v-card
            class="ma-4 rounded-lg"
            outlined
            elevation="0"
        >
            <v-list-item>
                <v-list-item-content class="flex-column align-left">
                    <v-list-item-avatar tile size="4rem">
                        <v-img src="../.././logo/logo.png" />
                    </v-list-item-avatar>
                    <v-list-item-title class="py-2 logo-text">
                        {{ title }}
                    </v-list-item-title>
                </v-list-item-content>
            </v-list-item>
        </v-card>
        <v-sheet
            class="ma-4 main-text"
        >
            <div style="white-space: pre-wrap;" v-text="description" />
        </v-sheet>
        <v-divider class="ma-4" />
    </rgis-page>
</template>

<script lang="ts" src="./GwtkHomeLearnMore.ts" />

<style>
    .logo-text {
        width: 270px;
        white-space: normal;
        font-weight: 400;
        text-align: center;
    }

    .main-text {
        text-align: justify;
    }
</style>