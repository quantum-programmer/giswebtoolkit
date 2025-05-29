<template>
    <v-list
        dense
        class="pt-0 overflow-y-auto"
        max-height="500"
        style="margin: -8px -8px 0;"
    >
        <v-list-item-group
            :value="logotype"
            @change="setLogotype"
        >
            <gwtk-list-item
                v-for="(logotype, logotypeIndex) in logotypes"
                :key="'logotype-' + logotypeIndex"
                :class="'export-report__logotype-' + logotypeIndex"
                :title="logotype.label"
                :disabled="disabled"
                class="gwtk-export-report-select-logotype-item"
                @click.stop.prevent
            >
                <template
                    #left-slot
                >
                    <v-list-item-icon>
                        <v-img
                            :src="logotype.url"
                            :alt="logotype.label"
                            max-height="24"
                            width="24"
                            contain
                            @click.stop="previewLogotype(logotypeIndex)"
                        />
                    </v-list-item-icon>
                </template>
            </gwtk-list-item>
        </v-list-item-group>

        <v-dialog
            :value="previewingLogotype"
            max-width="500"
            @click:outside="closePreview"
            @keydown.esc="closePreview"
        >
            <v-card
                v-if="previewingLogotype"
                class="logotype-preview pa-4 text-center"
                style="line-height: 0;"
                @click="closePreview"
            >
                <img
                    :src="previewingLogotype.url"
                    :alt="previewingLogotype.label"
                    style="max-width: 100%;"
                >
            </v-card>
        </v-dialog>
    </v-list>
</template>

<script src="./GwtkSelectLogotype.ts"></script>
