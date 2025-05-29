<template>
    <rgis-page
        :title="$t(category.alias)"
        :color="category.color"
        @backClicked="backClickHandler"
    >
        <v-list
            v-if="activeSubCategoryId===null"
            class="pa-0"
        >
            <template
                v-for="(item, index) in category.items"
            >
                <v-list-item
                    :key="index"
                    class="py-1"
                    @click="selectSubCategory(item.id)"
                >
                    <v-list-item-avatar
                        color="var(--color-blue-light-03)"
                        size="32"
                    >
                        <gwtk-icon :name="category.icon" :size="22" color=" var(--v-primary-base)" />
                    </v-list-item-avatar>
                    <v-list-item-title>{{ $t(item.alias) }}</v-list-item-title>
                </v-list-item>
                <v-divider
                    :key="item.alias"
                    class="mx-4"
                />
            </template>
        </v-list>

        <gwtk-home-help-have-question
            v-else-if="activeSubCategoryId==='haveQuestion'"
            :sub-category="category.items.find(item=>item.id===activeSubCategoryId)"
            :color="category.color"
            @backClick="activeSubCategoryId=null"
        />
        <gwtk-home-help-useful-telephones
            v-else-if="activeSubCategoryId==='usefulTelephones'"
            :sub-category="category.items.find(item=>item.id===activeSubCategoryId)"
            :color="category.color"
            @backClick="activeSubCategoryId=null"
        />
    </rgis-page>
</template>

<script lang="ts" src="./GwtkHomeHelp.ts" />