<template>
    <v-dialog
        v-model="dialog"
        overlay-opacity="0.25"
        light
        width="450"
    >
        <v-card light outlined>
            <v-card-title class="headline grey lighten-2 ">
                {{ title }}
            </v-card-title>
            <v-card-text class="text-body-1 text-center pa-md-4 mx-lg-auto">
                {{ message }}
            </v-card-text>
            <v-divider />
            <v-card-actions class="justify-center">
                <v-btn
                    color="grey lighten-2"
                    @click="onClose"
                >
                    OK
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" src="./GwtkInfoDialog.ts">
</script>

