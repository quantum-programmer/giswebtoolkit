<template>
    <v-dialog
        v-model="showDialog"
        max-width="320"
    >
        <v-card>
            <v-card-title class="font-weight-bold">
                {{ titleText }}
            </v-card-title>
            <v-card-text class="text-body-2">
                <v-text-field
                    v-if="title"
                    v-model="inputText"
                    :label="title"
                    required
                    counter
                    maxlength="255"
                    clearable
                />
                <span v-if="description" class="font-weight-medium">
                    {{ description }}
                </span>
            </v-card-text>
            <v-card-actions>
                <v-row dense class="ma-1">
                    <gwtk-button
                        class="test-confirm-apply"
                        primary
                        :title="applyText"
                        :disabled="!!title&&!inputText"
                        @click="onApply"
                    />
                    <v-spacer />
                    <gwtk-button
                        class="test-confirm-cancel"
                        secondary
                        :title="cancelText"
                        @click="onCancel"
                    />
                </v-row>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" src="./GwtkInputTextDialog.ts">
</script>

<style scoped>

</style>