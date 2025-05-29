<template>
    <gwtk-task-container-item
        :task-id="taskId"
        :description="description"
        :map-vue="mapVue"
    >
        <v-row no-gutters class="pb-4">
            <v-progress-linear
                :active="loadingPanorama"
                indeterminate
                rounded
                height="6"
            />
        </v-row>
        <v-row
            v-if="!apiYandexConnect"
            no-gutters
            class="pb-4 mx-2"
        >
            <v-col cols="12">
                <div>
                    {{ $t('yandexpanorama.For viewing street panoramas YandexMaps API technologies are used') }}
                </div>
                <v-row
                    v-if="keyApiYandexValue===''"
                    no-gutters
                >
                    <v-text-field
                        v-model="keyApiYandexValue"
                        :label="$t('yandexpanorama.Enter the YandexMaps API key')"
                        append-outer-icon="mdi-send"
                        clear-icon="mdi-close-circle"
                        clearable
                        @click:append-outer="sendKey"
                    />
                </v-row>
                <v-row
                    v-if="keyApiYandexValue===''"
                    no-gutters
                >
                    <div>
                        {{ $t('yandexpanorama.To get the key') }}
                        <a
                            href="https://yandex.ru/dev/developer-help/doc/api/auth.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            style="text-decoration: underline !important;"
                        >
                            {{ $t('yandexpanorama.follow the link') }}
                        </a>
                    </div>
                </v-row>
            </v-col>
        </v-row>
        <v-row
            v-if="apiYandexConnect"
            no-gutters class="pb-4 mx-2"
        >
            <v-row
                v-if="!panoramaFound"
            >
                <div>
                    {{ $t('yandexpanorama.Pick a point on the map') }}
                </div>
            </v-row>
            <v-row
                v-if="panoramaFound"
            >
                <div
                    :id="idYandexPanoramaPlayer"
                    class="player yandexPlayer"
                    type="player"
                />
            </v-row>
        </v-row>
    </gwtk-task-container-item>
</template>

<script src="./GwtkYandexPanoramaWidget.ts" />
<style scoped>
    .yandexPlayer {
        width: 100%;
        height: 500px;
        position: relative;
    }
</style>
