<template>
    <v-list-item
        color="primary"
        link
        dense
        @click="checkTemplate"
    >
        <v-list-item-icon>
            <v-icon>
                {{ isPublic ? 'mdi-account-multiple-outline' : 'mdi-account' }}
            </v-icon>
        </v-list-item-icon>

        <v-list-item-title>
            {{ template.templateTitle }}
        </v-list-item-title>

        <v-list-item-action
            class="ma-0"
        >
            <v-menu
                left
                bottom
                nudge-bottom="24"
                @click.stop
            >
                <template
                    #activator="{on, attrs}"
                >
                    <v-icon
                        v-bind="attrs"
                        v-on="on"
                    >
                        mdi-dots-horizontal
                    </v-icon>
                </template>
                <v-list
                    dense
                >
                    <v-list-item
                        @click="exportTemplate"
                    >
                        <v-list-item-icon>
                            <v-icon>
                                mdi-export
                            </v-icon>
                        </v-list-item-icon>

                        <v-list-item-title>
                            {{ $t('exportReport.Export') }}
                        </v-list-item-title>
                    </v-list-item>

                    <v-list-item
                        v-if="!isPublic || isAdmin"
                        @click="deleteTemplate"
                    >
                        <v-list-item-icon>
                            <v-icon>
                                mdi-delete
                            </v-icon>
                        </v-list-item-icon>

                        <v-list-item-title>
                            {{ $t('exportReport.Delete') }}
                        </v-list-item-title>
                    </v-list-item>

                    <v-list-item
                        v-if="!isPublic && isAdmin"
                        @click="publicTemplate"
                    >
                        <v-list-item-icon>
                            <v-icon>
                                mdi-account-multiple-outline
                            </v-icon>
                        </v-list-item-icon>

                        <v-list-item-title>
                            {{ $t('exportReport.Save into public') }}
                        </v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
        </v-list-item-action>
    </v-list-item>
</template>

<script src="./ListItem.ts"></script>
