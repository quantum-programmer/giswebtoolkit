<template>
    <v-sheet
        :task-id="taskId"
        :description="description"
        style="min-height: inherit;"
        class="gwtk-scroll-ios"
        :class="$vuetify.breakpoint.smAndUp?'tablet-device':''"
    >
        <v-card
            v-if="isShowMain"
            class="pa-3 ma-0 gwtk-img-home"
            elevation="0"
            style="min-height: inherit;"
        >
            <v-card class="pa-4" color="transparent" elevation="0">
                <v-list-item class="pr-0">
                    <v-list-item-avatar tile size="4rem">
                        <v-img
                            src="./logo/logo.png"
                        />
                    </v-list-item-avatar>
                    <v-list-item-content>
                        <v-list-item-title>РГИС</v-list-item-title>
                        <v-list-item-title>Рязанской области</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-card>
            <v-sheet class="d-flex flex-wrap justify-space-between" color="transparent">
                <v-card
                    v-for="(item, index) in categories"
                    :key="index"
                    class="pa-2 my-1 overflow-hidden rounded-lg"
                    elevation="0"
                    :color="item.color"
                    :width="index === 0 || index + 1 === categories.length? '100%' : '49%'"
                    :min-height="index === 0 || index + 1 === categories.length? '74' : '130'"
                    @click="selectCategory(item.id)"
                >
                    <v-list-item
                        v-if="index === 0 || index + 1 === categories.length"
                        class="pr-0"
                    >
                        <v-list-item-avatar tile size="42">
                            <gwtk-icon :name="item.icon" color="white" :size="36" />
                        </v-list-item-avatar>
                        <v-list-item-title class="white--text">
                            {{ $t(item.alias) }}
                        </v-list-item-title>
                    </v-list-item>
                    <v-list-item
                        v-else
                        class="pr-0"
                    >
                        <v-list-item-content class="flex-column align-left">
                            <v-list-item-avatar tile size="42" class="gwtk-small-card-icon mt-0">
                                <gwtk-icon :name="item.icon" color="white" :size="36" />
                            </v-list-item-avatar>
                            <v-list-item-title class="white--text gwtk-small-card-text">
                                {{ $t(item.alias) }}
                            </v-list-item-title>
                        </v-list-item-content>
                    </v-list-item>
                    <v-avatar
                        :size="index === 0 || index + 1 === categories.length? '220' : '190'"
                        :class="index === 0 || index + 1 === categories.length? 'gwtk-big-card-circle' : 'gwtk-small-card-circle'"
                    />
                </v-card>
            </v-sheet>
        </v-card>
        <gwtk-home-learn-more
            v-else-if="isShowLearnMore"
            :set-state="setState"
            :category="selectedCategory"
        />
        <gwtk-home-help v-else-if="isShowHelp"
                        :set-state="setState"
                        :category="selectedCategory"
                        @selectCategory="selectCategory"
        />
        <gwtk-home-category
            v-else
            :set-state="setState"
            :category="selectedCategory"
        />
    </v-sheet>
</template>

<script lang="ts" src="./GwtkHomeMain.ts" />

<style scoped>
    .gwtk-big-card-circle {
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 50% !important;
        position: absolute !important;
        top: -35px;
        right: -130px;
    }

    .gwtk-small-card-text {
        max-width: 147px;
        white-space: normal;
        font-weight: 600;
        padding-top: 8px;
        text-align: left;
        align-self: flex-start !important;
    }

    .gwtk-small-card-icon {
        align-self: flex-start !important;
    }

    .gwtk-small-card-circle {
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 50% !important;
        position: absolute !important;
        top: -115px !important;
        right: -100px !important;
    }


    .gwtk-img-home {
        background: url('./logo/rgisro_background.png') no-repeat;
        background-size: cover;
        -webkit-background-size: cover;
        -moz-background-size: cover;
        -o-background-size: cover;
        border-radius: 0;
    }

    .gwtk-scroll-ios {
        position: fixed;
        height: 95%;
        width: 100%;
        left: 0;
        top: 0;
        overflow-y: scroll;
    }

    .tablet-device {
        /*box-sizing: content-box;*/
        overflow: auto;
    }
</style>