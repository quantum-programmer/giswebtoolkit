<template>
    <div v-if="isActive">
        <component
            :is="component.name"
            :key="component.name"
            v-bind="{...component.propsData, mapVue}"
        />
    </div>
</template>

<script lang="ts" src="./GwtkMap3dTaskContainer.ts" />