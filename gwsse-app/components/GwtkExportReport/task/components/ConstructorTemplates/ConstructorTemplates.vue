<template>
    <v-card>
        <div
            class="pa-2 gwtk-export-report-templates-buttons"
        >
            <gwtk-button
                :title="$t('exportReport.Add') + ''"
                :disabled="!isLogged || !formIsValid"
                icon="mdi-invoice-text-plus-outline"
                icon-size="20"
                class="mx-2"
                secondary
                @click="addTemplate(false)"
            />
            <gwtk-button
                :title="$t('exportReport.Open') + ''"
                :disabled="!isLogged || !formIsValid"
                icon="mdi-folder-open-outline"
                icon-size="20"
                class="mx-2"
                secondary
                @click="importTemplate(false)"
            />
        </div>

        <v-card-text
            v-if="enterTitleVisible"
            class="py-0"
        >
            <v-text-field
                v-model.trim="templateTitle"
                :label="$t('exportReport.Enter template name')"
                autofocus
                @keydown.enter="addTemplateSubmit"
                @keydown.esc="enterTitleVisible = false"
            >
                <template
                    #append-outer
                >
                    <gwtk-icon-button
                        v-if="templateTitle"
                        icon="mdi-check-circle"
                        icon-size="24"
                        selected
                        @click="addTemplateSubmit"
                    />
                </template>
            </v-text-field>
        </v-card-text>

        <v-card-text
            v-if="constructorTemplatesPublic.length || constructorTemplatesLocal.length"
            class="px-0"
        >
            <v-list-item-group
                v-model="listItem"
            >
                <list-item
                    v-for="(template, templateIndex) in constructorTemplatesPublic"
                    :key="'template-public-' + templateIndex"
                    :template="template"
                    :template-index="templateIndex"
                    :is-public="true"
                    :is-admin="isAdmin"
                    @checkTemplate="checkTemplate"
                    @exportTemplate="exportTemplate"
                    @deleteTemplate="deleteTemplate"
                />

                <list-item
                    v-for="(template, templateIndex) in constructorTemplatesLocal"
                    :key="'template-local-' + templateIndex"
                    :template="template"
                    :template-index="templateIndex"
                    :is-public="false"
                    :is-admin="isAdmin"
                    @checkTemplate="checkTemplate"
                    @exportTemplate="exportTemplate"
                    @deleteTemplate="deleteTemplate"
                    @publicTemplate="publicTemplate"
                />
            </v-list-item-group>
        </v-card-text>

        <v-card-actions
            class="px-2 gwtk-export-report-templates-buttons"
        >
            <gwtk-button
                :title="$t('exportReport.Select') + ''"
                icon="mdi-check"
                icon-size="20"
                class="mx-2"
                primary
                :disabled="!(listItem >= 0)"
                @click="selectTemplate"
            />

            <v-spacer />

            <gwtk-button
                :title="$t('exportReport.Cancel') + ''"
                icon="mdi-close"
                icon-size="20"
                class="mx-2"
                secondary
                @click="switchToSettingsTab"
            />
        </v-card-actions>
    </v-card>
</template>

<script src="./ConstructorTemplates.ts" lang="ts"></script>

<style scoped>
.gwtk-export-report-templates-buttons ::v-deep .v-btn:not(.v-btn--round).v-size--default{
    height: var(--v-btn-height--default);
}
</style>
