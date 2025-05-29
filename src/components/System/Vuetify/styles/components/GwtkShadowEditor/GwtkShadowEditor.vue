<template>
    <div>
        <v-row class="align-baseline">
            <v-col class="text-body-1 font-weight-bold grey--text">
                {{ $t('phrases.Shadow') }}
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
                    <gwtk-color-editor
                        :value="color"
                        @input="updateColor"
                    />
                </v-col>
            </v-row>
            <v-row>
                <v-col>
                    {{ $t('phrases.X offset') }}
                    <v-text-field
                        :value="offset.x"
                        type="number"
                        :min="-100"
                        :max="100"
                        outlined
                        dense
                        hide-details
                        @input="updateOffsetX"
                    />
                </v-col>
            </v-row>
            <v-row>
                <v-col>
                    {{ $t('phrases.Y offset') }}
                    <v-text-field
                        :value="offset.y"
                        type="number"
                        :min="-100"
                        :max="100"
                        outlined
                        dense
                        hide-details
                        @input="updateOffsetY"
                    />
                </v-col>
            </v-row>
        </template>
    </div>
</template>

<script lang="ts" src="./GwtkShadowEditor.ts"></script>