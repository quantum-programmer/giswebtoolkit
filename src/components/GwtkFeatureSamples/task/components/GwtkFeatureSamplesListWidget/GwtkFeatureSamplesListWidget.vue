<template>
    <v-container class="gwtk-main-container">
        <v-tooltip
            bottom
        >
            <template #activator="{ on }">
                <gwtk-button
                    primary
                    width-available
                    class="gwtk-test-featureSamples-create"
                    icon="mdi-plus"
                    icon-color="var(--color-white)"
                    :title="$t('phrases.Create') + ' (' + selectedObjectCount + ')' "
                    :disabled="selectedObjectCount === 0"
                    v-on="on"
                    @click="createGroup"
                />
            </template>
            <div>{{ $t('featuresamples.Create list') }}</div>
        </v-tooltip>
        <v-list v-if="groupList.length !== 0" class="gwtk-group-list">
            <v-list-item-group multiple :value="itemGroupActiveList">
                <gwtk-list-item
                    v-for="(group, idx) in groupList"
                    :key="idx"
                    :class="['gwtk-test-featureSamples-group' + idx, isActive(group.id) ? 'blue lighten-5' : 'no-focus']"
                    @click="()=>clickOnListItem(group.id)"
                >
                    <v-row>
                        <v-col
                            cols="auto"
                            align-self="center"
                            class="pr-0"
                        >
                            <div
                                class="gwtk-sample-icon"
                                :style="{backgroundImage:`url('${group.image}')`}"
                            />
                        </v-col>
                        <v-col
                            class="text-subtitle-1"
                            cols="0"
                            style="overflow-wrap: anywhere;"
                            align-self="center"
                        >
                            {{ group.name }}
                        </v-col>
                        <v-col
                            cols="auto"
                            align-self="center"
                            class="px-0"
                        >
                            <v-tooltip bottom>
                                <template #activator="{ on }">
                                    <gwtk-icon-button
                                        class="gwtk-test-featureSamples-selectItem"
                                        icon="double-check"
                                        v-on="on"
                                        @click.stop="selectItemList(group.id)"
                                    />
                                </template>
                                <div>{{ $t('featuresamples.List select') }}</div>
                            </v-tooltip>
                        </v-col>
                        <v-col
                            cols="auto"
                            align-self="center"
                            class="px-0"
                        >
                            <v-tooltip bottom>
                                <template #activator="{ on }">
                                    <gwtk-icon-button
                                        class="gwtk-test-featureSamples-showItem"
                                        icon="mdi-file-tree"
                                        v-on="on"
                                        @click.stop="onClickShowItemList(group.id)"
                                    />
                                </template>
                                <div>{{ $t('featuresamples.List view') }}</div>
                            </v-tooltip>
                        </v-col>
                        <v-col
                            cols="auto"
                            align-self="center"
                            class="pl-0"
                        >
                            <v-tooltip bottom>
                                <template #activator="{ on }">
                                    <gwtk-icon-button
                                        class="gwtk-test-featurSamples-deleteGroup"
                                        icon="mdi-delete-outline"
                                        v-on="on"
                                        @click.stop="openConfirm(idx)"
                                    />
                                </template>
                                <div>{{ $t('featuresamples.Remove list') }}</div>
                            </v-tooltip>
                        </v-col>
                    </v-row>
                    <v-container v-if="confirmId === idx">
                        <v-row>
                            <v-col>
                                <gwtk-button
                                    primary
                                    class="gwtk-test-featureSamples-confirmDelete"
                                    :title="$t('phrases.Remove')"
                                    @click="deleteGroup(group.id)"
                                />
                            </v-col>
                            <v-spacer />
                            <v-col>
                                <gwtk-button
                                    secondary
                                    :title="$t('phrases.Cancel')"
                                    @click="openConfirm(-1)"
                                />
                            </v-col>
                        </v-row>
                    </v-container>
                    <v-divider />
                </gwtk-list-item>
            </v-list-item-group>
        </v-list>
        <v-container v-else>
            {{ $t('featuresamples.No lists found') }}
        </v-container>
    </v-container>
</template>

<script lang="ts" src="./GwtkFeatureSamplesListWidget.ts" />

<style scoped>
    .gwtk-main-container {
        height: 100%;
    }

    .gwtk-group-list {
        max-height: calc(100% - 36px);
        overflow-x: hidden;
        overflow-y: auto;
    }

    .gwtk-sample-icon {
        width: 18px;
        height: 18px;
        background-repeat: no-repeat;
        background-size: cover;
    }

    .no-focus:focus:before {
        opacity: 0 !important;
    }
</style>
