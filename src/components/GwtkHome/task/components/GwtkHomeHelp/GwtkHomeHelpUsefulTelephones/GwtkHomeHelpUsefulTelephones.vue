<template>
    <rgis-page
        :title="$t(subCategory.alias)"
        :color="color"
        @backClicked="$emit('backClick')"
    >
        <v-list class="pa-0 mx-4 mb-3">
            <template
                v-for="(item, index) in subCategory.filter"
            >
                <v-divider v-if="index!==0" :key="'divider_'+index" />
                <v-list-item :key="item.id" tree-line>
                    <v-list-item-content>
                        <v-list-item-title class="text-wrap">
                            {{ item.alias }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            <v-btn
                                height="20"
                                x-small
                                elevation="0"
                                class="pa-0 text-body-2"
                                color="transparent"
                                :href="'tel:'+item.nodes[0]"
                            >
                                <v-icon class="mr-1" size="20" color="#1672EC">
                                    mdi-phone-outline
                                </v-icon>
                                {{ item.nodes[0] }}
                            </v-btn>
                        </v-list-item-subtitle>
                        <v-list-item-subtitle>
                            <v-btn
                                x-small
                                elevation="0"
                                class="pa-0 text-body-2 text-lowercase"
                                color="transparent"
                                :href="'mailto:'+item.nodes[1]"
                            >
                                <v-icon class="mr-1" size="20" color="#1672EC">
                                    mdi-email-outline
                                </v-icon>
                                {{ item.nodes[1] }}
                            </v-btn>
                        </v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>
            </template>
        </v-list>
    </rgis-page>
</template>

<script lang="ts" src="./GwtkHomeHelpUsefulTelephones.ts" />