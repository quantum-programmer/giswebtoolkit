<template>
    <v-row
        class="pa-0 rounded"
    >
        <template v-for="(component, index) in components">
            <component
                :is="component.name"
                :key="index"
                v-bind="{...component.propsData, iconButton:true, mapVue}"
            />
        </template>
    </v-row>
</template>

<script lang="ts" src="./GwtkLeftToolbar.ts" />
