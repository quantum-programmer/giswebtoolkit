<template>
    <gwtk-selectable
        :fill="selected"
    >
        <v-card
            v-blur
            class="pa-0 pr-0 mb-1 no-focus"
            :ripple="false"
            flat
            @click="$emit('mapobject:click', mapObjectContent.mapObject.guid)"
        >
            <v-row dense justify="space-between">
                <v-col v-if="dataSrc" cols="auto" class="align-self-center">
                    <div class="gwtk-picture-container border">
                        <img
                            class="gwtk-picture-icon"
                            alt=""
                            :src="dataSrc"
                        >
                    </div>
                </v-col>
                <v-col cols="auto" class="py-1 pr-3 pl-3">
                    <v-list-item-title class="text-sm-subtitle-2 font-weight-bold unset-whitespace gwtk-object-title">
                        {{ objectName }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="d-flex text-sm-subtitle-2">
                        <span>{{ creationTime }}</span>
                    </v-list-item-subtitle>
                </v-col>
                <v-col cols="auto" class="py-1 pr-3 pl-3 align-self-center">
                    <v-tooltip bottom>
                        <template #activator="{ on }">
                            <gwtk-icon-button
                                :icon="'share'"
                                :icon-size="18"
                                v-on="on"
                                @click.stop="shareMapmark"
                            />
                        </template>
                        <div>{{ shareTooltip }}</div>
                    </v-tooltip>
                </v-col>
            </v-row>
        </v-card>
    </gwtk-selectable>
</template>

<script type="ts" src="./GwtkMapObjectItem.ts" />
<style scoped>

    .gwtk-picture-container {
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--v-secondary-base)
    }

    .gwtk-picture-icon {
        min-width: var(--preview-image-size);
        min-height: var(--preview-image-size);
        max-height: var(--preview-image-size);
        max-width: var(--preview-image-size);
        object-fit: contain;
    }

    .unset-whitespace {
        white-space: unset;
    }

    .no-focus:focus:before {
        opacity: 0 !important;
    }

    .gwtk-object-title {
        min-height: 28px;
    }

    .gwtk-flex-1 {
        flex: 1;
    } 

</style>
