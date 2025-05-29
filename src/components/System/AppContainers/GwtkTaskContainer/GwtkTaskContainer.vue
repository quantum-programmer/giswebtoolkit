<template>
    <div v-if="value" v-show="showItem">
        <component
            :is="component.name"
            :key="component.name"
            v-bind="{...component.propsData, mapVue}"
        />
    </div>
</template>

<script lang="ts" src="./GwtkTaskContainer.ts" />
