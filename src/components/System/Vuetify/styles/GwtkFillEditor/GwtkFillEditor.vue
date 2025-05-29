<template>
    <div class="mb-4">
        <v-row class="align-baseline">
            <v-col class="text-body-1 font-weight-bold grey--text">
                {{ $t('phrases.Filling') }}
            </v-col>
            <v-switch
                v-if="removable"
                v-model="enabledFlag"
                hide-details
                @change="updateValue"
            />
        </v-row>
        <template v-if="enabledFlag">
            <v-row>
                <v-col>
                    <gwtk-color-editor
                        :value="color"
                        @input="updateColor"
                    />
                </v-col>
            </v-row>
            <v-row>
                <v-col class="pb-0 ml-1 mr-1">
                    {{ $t('phrases.Opacity') }}
                    <v-slider
                        :value="opacity"
                        :min="0"
                        :max="100"
                        thumb-label
                        hide-details
                        @change="updateOpacity"
                    />
                </v-col>
            </v-row>
        </template>
    </div>
</template>

<script lang="ts" src="./GwtkFillEditor.ts"></script>