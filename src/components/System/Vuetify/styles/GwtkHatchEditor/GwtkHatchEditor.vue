<template>
    <div class="mb-4">
        <v-row>
            <v-col class="text-body-1 font-weight-bold grey--text">
                {{ $t('phrases.Hatching') }}
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
                <v-col>
                    {{ $t('phrases.Thickness') }}
                    <v-text-field
                        :value="width"
                        type="number"
                        :min="0"
                        :max="100"
                        outlined
                        dense
                        hide-details
                        @input="updateWidth"
                    />
                </v-col>
            </v-row>
            <v-row>
                <v-col class="pb-0 ml-1 mr-1">
                    {{ $t('phrases.Step') }}
                    <v-slider
                        :value="step"
                        :min="1"
                        :max="100"
                        thumb-label
                        hide-details
                        @change="updateStep"
                    />
                </v-col>
            </v-row>
            <v-row>
                <v-col class="pb-0 ml-1 mr-1">
                    {{ $t('phrases.Angle') }}
                    <v-slider
                        :value="angle"
                        :min="0"
                        :max="360"
                        step="45"
                        thumb-label
                        hide-details
                        @change="updateAngle"
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

<script lang="ts" src="./GwtkHatchEditor.ts"></script>