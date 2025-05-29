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
            <template v-if="category.items.length">
                <template
                    v-for="(item, index) in category.items"
                >
                    <v-list-item
                        :key="index"
                        :disabled="item.disabled"
                        class="py-1"
                        @click="selectSubCategory(item.id)"
                    >
                        <v-list-item-avatar
                            color="var(--color-blue-light-03)"
                            size="32"
                        >
                            <gwtk-icon :name="category.icon" :size="22" color=" var(--v-primary-base)" />
                        </v-list-item-avatar>
                        <v-list-item-title>
                            {{ item.alias }}
                            <div v-if="item.disabled" class="text-caption">
                                {{ $t('rgis.Section information will be supplemented') }}
                            </div>
                        </v-list-item-title>
                        <v-list-item-action
                            v-if="item.filter.length>0"
                            @click="activeSubCategoryId=item"
                        >
                            <gwtk-icon name="filter-settings-home" color="var(--v-secondary-lighten1)" />
                        </v-list-item-action>
                    </v-list-item>
                    <v-divider
                        :key="item.alias"
                        class="mx-4"
                    />
                </template>
            </template>
            <v-container v-else>
                <v-row v-if="category.id === 'beekeeper'" dense>
                    <v-col>
                        {{ $t('beekeeper.To register a user with the role of «Beekeeper», it is necessary to contact the Ministry of Agriculture and Food of the Ryazan region with the indication of contact details!') }}
                    </v-col>
                </v-row>
                <v-row v-else-if="category.id === 'plantBreeder'" dense>
                    <v-col>
                        {{ $t('plantbreeder.To register a user with the role of «Plant Breeder», it is necessary to contact the Ministry of Agriculture and Food of the Ryazan region with the indication of contact details!') }}
                    </v-col>
                </v-row>
                <v-row v-else dense>
                    <v-col>
                        {{ $t('rgis.Section information will be supplemented') }}
                    </v-col>
                </v-row>
            </v-container>
        </v-list>
        <gwtk-home-sub-category
            v-else
            :set-state="setState"
            :sub-category="activeSubCategoryId"
            :color="category.color"
            @backClick="activeSubCategoryId=null"
        />
    </rgis-page>
</template>

<script lang="ts" src="./GwtkHomeCategory.ts" />