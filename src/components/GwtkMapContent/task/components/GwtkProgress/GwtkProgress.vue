<template>
    <v-progress-linear
        v-if="visible"
        :indeterminate="indeterminate"
        :value="percent"
    />
</template>

<script src="./GwtkProgress.ts" lang="ts"></script>
