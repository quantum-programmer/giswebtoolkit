<template>
    <div>
        <v-btn-toggle
            :value="selectedTab"
            mandatory
            class="my-2"
            borderless
            color="primary"
            @change="selectTab"
        >
            <gwtk-button
                clean
                :title="`${$t('phrases.Marker')}${selectedPointObjectsCount ? ('(' + selectedPointObjectsCount + ')') : ''}`"
                :selected="selectedTab===pointButton"
                :value="pointButton"
            />
            <gwtk-button
                clean
                :title="`${$t('phrases.Line')}${selectedLineObjectsCount ? ('(' + selectedLineObjectsCount + ')') : ''}`"
                :selected="selectedTab===lineButton"
                :value="lineButton"
            />
            <gwtk-button
                clean
                :title="`${$t('phrases.Polygon')}${selectedPolygonObjectsCount ? ('(' + selectedPolygonObjectsCount + ')') : ''}`"
                :selected="selectedTab===polygonButton"
                :value="polygonButton"
            />
            <!--                <gwtk-button-->
            <!--                    clean-->
            <!--                    :value="3"-->
            <!--                    :selected="activeTab==='tab_legend'"-->
            <!--                >-->
            <!--                    {{ $t('mymaps.Legend') }}-->
            <!--                </gwtk-clean-button>-->
        </v-btn-toggle>
        <div
            class="gwtk-templates-container-main"
        >
            <gwtk-selectable
                v-for="(style, index) in getTemplatesList()"
                :key="'style_'+index"
                :border="getItemFlags(index)[0]"
                :disabled="getItemFlags(index)[1]"
            >
                <v-img
                    :src="style.icon"
                    aspect-ratio="1"
                    contain
                    class="ma-1 border gwtk-templates-container-image"
                    @click="selectTemplate(index)"
                >
                    <template #placeholder>
                        <v-row
                            class="fill-height ma-0"
                            align="center"
                            justify="center"
                        >
                            <v-progress-circular
                                indeterminate
                            />
                        </v-row>
                    </template>
                </v-img>
            </gwtk-selectable>
            <gwtk-icon-button
                class="ma-1 mt-5"
                style="min-width: 64px;"
                icon-mode
                icon="mdi-plus"
                @click="addStyle"
            />
        </div>
    </div>
</template>

<script lang="ts" src="./GwtkTemplatesGallery.ts"></script>

<style scoped>
    .gwtk-templates-container-main {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        max-height: 340px;
        overflow-y: auto;
    }

    .gwtk-templates-container-image {
        cursor: pointer;
        min-width: 3rem;
        max-width: 3rem;
        border: 1px dashed var(--v-secondary-base)
    }
    ::v-deep .v-image__image--contain {
        background-size: cover;
    }
</style>