<template>
    <div>
        {{ !hasLabel? $t('phrases.Color') : '' }}
        <v-text-field
            :value="value"
            :label="hasLabel? $t('phrases.Color') : ''"
            outlined
            dense
            hide-details
            readonly
        >
            <template #append>
                <v-menu
                    :close-on-content-click="false"
                    top
                    offset-y
                >
                    <template #activator="{ on }">
                        <div
                            class="select-color-field border"
                            :style="'background-color: ' + value"
                            v-on="on"
                        />
                    </template>
                    <v-color-picker
                        :value="value"
                        mode="hexa"
                        hide-mode-switch
                        dot-size="20"
                        @update:color="handleInput"
                    />
                </v-menu>
            </template>
        </v-text-field>
    </div>
</template>

<script lang="ts" src="./GwtkColorEditor.ts"></script>

<style scoped>
    .select-color-field {
        height: 1.5em;
        width: 1.5em;
        border-radius: .25em;
    }
</style>