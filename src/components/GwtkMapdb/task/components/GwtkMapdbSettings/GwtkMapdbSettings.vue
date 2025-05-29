<template>
    <div
        style="height: 100%; overflow: hidden;"
        class="mx-2 my-n2"
    >
        <v-container>
            <div style="max-height: 345px; display: flex;  flex-flow: column wrap;  overflow-y: hidden;">
                <div style="display: flex; justify-items: start;">
                    <v-simple-checkbox
                        color="primary"
                        :value="getCheckedAll()"
                        @click="onSelectAll"
                    />
                    {{ $t('phrases.Select all') }}
                </div>
                <v-divider class="mb-1" />
                <div
                    v-for="(element, elementId) in fieldsList"
                    :key="elementId"
                    style="flex-basis: 5%;"
                >
                    <span style="display: flex; width: 300px; margin: auto;">
                        <span>
                            <v-simple-checkbox
                                color="primary"
                                :value="getChecked(element)"
                                @input="onCheckboxWidget(element)"
                            />
                        </span>
                        <span>
                            {{ element.field }}
                        </span>
                    </span>
                </div>
            </div>
        </v-container>
    </div>
</template>

<script lang="ts" src="./GwtkMapdbSettings.ts" />

<style scoped>
.main-container {
    height: calc(100% - 68px);
    overflow-y: auto;
    overflow-x: hidden;
}

.gwtk-page-toolbar.v-sheet {
    cursor: pointer;
}
</style>