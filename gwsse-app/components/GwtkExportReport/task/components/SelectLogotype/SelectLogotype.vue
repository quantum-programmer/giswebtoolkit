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
            <v-list-item
                v-for="(logotype, logotypeIndex) in logotypes"
                :key="'logotype-' + logotypeIndex"
                :class="'export-report__logotype-' + logotypeIndex"
                @click.stop.prevent
            >
                <v-list-item-icon>
                    <v-img
                        :src="logotype.url"
                        :alt="logotype.label"
                        max-height="50"
                        width="50"
                        contain
                        @click.stop="previewLogotype(logotypeIndex)"
                    />
                </v-list-item-icon>
                <v-list-item-content>
                    {{ logotype.label }}
                </v-list-item-content>
            </v-list-item>
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

<script src="./SelectLogotype.ts"></script>
