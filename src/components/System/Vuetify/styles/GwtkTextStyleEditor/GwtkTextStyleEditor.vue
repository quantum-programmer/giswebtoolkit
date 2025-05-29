<template>
    <div class="mb-4">
        <v-row class="ml-2 text-body-1 font-weight-bold grey--text">
            {{ $t('phrases.Font style') }}
        </v-row>
        <v-container class="px-0">
            <v-row>
                <v-col>
                    <gwtk-color-editor
                        :value="color"
                        @input="updateColor"
                    />
                </v-col>
            </v-row>
            <gwtk-font-editor
                :item="font"
                :update-item="updateFont"
            />
        </v-container>
        <v-divider class="my-4 py-1 mb-0" />
        <gwtk-contour-editor
            :item="contour"
            disabled
            :update-item="updateContour"
        />
        <v-divider class="my-4 py-1 mb-0" />
        <gwtk-shadow-editor
            :item="shadow" disabled
            :update-item="updateShadow"
        />
    </div>
</template>

<script lang="ts" src="./GwtkTextStyleEditor.ts"></script>