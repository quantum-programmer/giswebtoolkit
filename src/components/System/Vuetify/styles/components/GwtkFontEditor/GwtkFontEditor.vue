<template>
    <div>
        <v-row>
            <v-col>
                {{ $t('phrases.Font family') }}
                <v-select
                    :value="family"
                    :items="fontList"
                    dense
                    flat
                    hide-details
                    outlined
                    solo
                    @change="updateFontFamily"
                />
            </v-col>
        </v-row>
        <v-row class="pb-0 mx-0">
            {{ $t('phrases.Font size') }}
        </v-row>
        <v-row dense>
            <v-col>
                <v-text-field
                    :value="size"
                    type="number"
                    :min="1"
                    :max="100"
                    outlined
                    dense
                    hide-details
                    @input="updateSize"
                />
            </v-col>
            <v-col cols="5">
                <v-btn-toggle
                    multiple
                    dense
                >
                    <v-btn
                        v-model="italic"
                        @click="toggleItalic"
                    >
                        <v-icon>mdi-format-italic</v-icon>
                    </v-btn>

                    <v-btn
                        v-model="bold"
                        @click="toggleBold"
                    >
                        <v-icon>mdi-format-bold</v-icon>
                    </v-btn>
                </v-btn-toggle>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts" src="./GwtkFontEditor.ts"></script>