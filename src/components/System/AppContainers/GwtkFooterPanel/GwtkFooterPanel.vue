<template>
    <div style="max-height: 100%;">
        <v-row no-gutters dense style="max-height: 100%">
            <v-col
                v-for="component in components"
                :key="component.name"
                cols="auto"
                class="mx-1 pa-0"
                style="pointer-events:auto;max-height: inherit;"
            >
                <component
                    :is="component.name"
                    v-bind="{...component.propsData, mapVue}"
                />
            </v-col>
        </v-row>
    </div>
</template>
<script lang="ts" src="./GwtkFooterPanel.ts" />

<style>
    /*.gwtk-style-bottom {*/
    /*    height: 32px;*/
    /*    margin-bottom: 0;*/
    /*}*/
</style>