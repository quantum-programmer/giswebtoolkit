<template>
    <div>
        <v-row class="align-baseline">
            <v-col class="text-body-1 font-weight-bold grey--text">
                {{ $t('phrases.Contour') }}
            </v-col>
            <v-switch
                v-if="!removable"
                v-model="enabledFlag"
                dense
                hide-details
                @change="updateValue"
            />
        </v-row>
        <template v-if="enabledFlag">
            <v-row>
                <v-col>
                    <gwtk-color-editor :value="color" @input="updateColor" />
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
        </template>
    </div>
</template>

<script lang="ts" src="./GwtkContourEditor.ts"></script>