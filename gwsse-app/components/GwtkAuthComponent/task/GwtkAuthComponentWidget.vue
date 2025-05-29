<template>
    <v-overlay
        absolute
        :light="!$vuetify.theme.dark"
        :dark="$vuetify.theme.dark"
        :class="$vuetify.breakpoint.xsOnly? 'mobile':''"
    >
        <gwtk-task-card
            class="gwtk-auth-window rounded"
            :title="title"
            window-mode
            :help-page-exists="mapVue.getTaskManager().checkHelpPage(taskId)"
            @help="openHelp"
            @close="onClick"
        >
            <v-img class="my-4 gwtk-auth-login-image" />
            <v-form v-if="isLogged">
                <v-col align="center" class="my-4">
                    <!--<div class="header-1">
                        {{ username }}
                    </div>-->
                    <div class="header-2">
                        {{ emailRegistration }}
                    </div>
                </v-col>
                <v-divider style="margin: 54px 0!important;" />
                <gwtk-button
                    secondary
                    width-available
                    :title="$t('auth.Sign out of account')"
                    @click="userLogout"
                />
            </v-form>
            <v-form v-else-if="isLogin">
                <v-col align="center" class="gwtk-auth-title">
                    {{ $t('auth.Enter') }}
                </v-col>
                <v-text-field
                    id="username"
                    v-model="username"
                    :label="$t('auth.Login')"
                    outlined
                    dense
                    class="my-4"
                    hide-details="auto"
                    required
                    clearable
                />
                <v-text-field
                    id="password"
                    v-model="password"
                    :label="$t('auth.Password')"
                    outlined
                    class="my-4"
                    dense
                    hide-details="auto"
                    required
                    :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    :type="showPassword ? 'text' : 'password'"
                    @click:append="showPassword = !showPassword"
                />
                <gwtk-button
                    primary
                    class="my-4"
                    width-available
                    :title="$t('auth.Log in')"
                    :disabled="username==='' || password===''"
                    @click="userLogin"
                />
                <a href="#" @click="gotoForgotForm">{{ $t('auth.Forgot password?') }}</a>
                <v-divider style="margin: 28px 0;" />
                <gwtk-button
                    secondary
                    width-available
                    class="my-4"
                    :title="$t('auth.Create account')"
                    @click="createAccount"
                />
            </v-form>
            <v-form v-else-if="isRegister">
                <v-col align="center" class="gwtk-auth-title">
                    {{ $t('auth.Registration') }}
                </v-col>
                <v-text-field
                    v-model="emailRegistration"
                    :label="$t('auth.Email')"
                    :rules="[required(emailRegistration),validEmail(emailRegistration)]"
                    dense
                    outlined
                    hide-details
                    required
                    class="my-4"
                    clearable
                />
                <v-text-field
                    v-model="passwordNew"
                    :label="$t('auth.Password')"
                    dense
                    outlined
                    hide-details
                    required
                    class="my-4"
                    :append-icon="showPasswordNew ? 'mdi-eye' : 'mdi-eye-off'"
                    :type="showPasswordNew ? 'text' : 'password'"
                    @click:append="showPasswordNew = !showPasswordNew"
                />
                <v-text-field
                    v-if="passwordNew"
                    v-model="passwordRepeat"
                    :label="$t( 'auth.Password confirm' )"
                    dense
                    outlined
                    hide-details
                    required
                    class="my-4"
                    :append-icon="showPasswordRepeat ? 'mdi-eye' : 'mdi-eye-off'"
                    :type="showPasswordRepeat ? 'text' : 'password'"
                    @click:append="showPasswordRepeat = !showPasswordRepeat"
                />
                <gwtk-button
                    primary
                    class="my-4"
                    width-available
                    :title="$t( 'auth.Next' )"
                    :disabled="!validEmail(emailRegistration) || passwordNew!==passwordRepeat || passwordNew===''"
                    @click="doRegister"
                />
                <v-divider style="margin: 28px 0;" />
                <span class="mr-1">{{ $t('auth.Already have account?') }}</span>
                <a href="#" @click="gotoLoginForm">{{ $t('auth.Log in') }}</a>
            </v-form>
            <v-form v-else-if="isRecoverEmailInputForm">
                <v-col align="center" class="gwtk-auth-title">
                    {{ $t('auth.Password recovery') }}
                </v-col>
                <div class="my-4" style="margin-bottom: 22px!important;">
                    {{ $t('auth.Enter email address, to which an email with a confirmation code will be sent:') }}
                </div>
                <v-text-field
                    v-model="emailRecover"
                    :rules="[required(emailRecover),validEmail(emailRecover)]"
                    :label="$t( 'auth.Email' )"
                    dense
                    outlined
                    hide-details
                    required
                    class="my-4"
                    clearable
                />
                <gwtk-button
                    primary
                    class="my-4"
                    width-available
                    :title="$t( 'auth.Next' )"
                    :disabled="!validEmail(emailRecover)"
                    @click="sendEmailForRecover"
                />
                <v-divider class="gwtk-auth-divider" />
                <a href="#" @click="gotoLoginForm">{{ $t('auth.Go to login page') }}</a>
            </v-form>
            <v-form v-if="isRecoverCodeInputForm">
                <v-col align="center" class="gwtk-auth-title">
                    {{ $t('auth.Password recovery') }}
                </v-col>
                <v-col>
                    {{ $t('auth.Email with a confirmation code has been sent to the address ') + emailRecover }}
                </v-col>
                <v-text-field
                    v-model="codeRecover"
                    :label="$t('auth.Enter code')"
                    dense
                    outlined
                    hide-details
                    required
                    class="my-4"
                />
                <gwtk-button
                    primary
                    class="my-4"
                    width-available
                    :title="$t( 'auth.Next' )"
                    :disabled="codeRecover===''"
                    @click="sendCode"
                />
                <v-divider class="gwtk-auth-divider" />
                <a href="#" @click="gotoForgotForm">{{ $t('auth.Send code again') }}</a>
            </v-form>
            <v-form v-if="isPasswordNewInputForm">
                <v-col align="center" class="gwtk-auth-title">
                    {{ $t('auth.Set new password') }}
                </v-col>
                <v-text-field
                    v-model="passwordNew"
                    :label="$t( 'auth.New password' )"
                    dense
                    outlined
                    hide-details
                    required
                    class="my-4"
                    :append-icon="showPasswordNew ? 'mdi-eye' : 'mdi-eye-off'"
                    :type="showPasswordNew ? 'text' : 'password'"
                    @click:append="showPasswordNew = !showPasswordNew"
                />
                <v-text-field
                    v-model="passwordRepeat"
                    :label="$t( 'auth.Password confirm' )"
                    dense
                    outlined
                    hide-details
                    required
                    class="my-4"
                    :append-icon="showPasswordRepeat ? 'mdi-eye' : 'mdi-eye-off'"
                    :type="showPasswordRepeat ? 'text' : 'password'"
                    @click:append="showPasswordRepeat = !showPasswordRepeat"
                />
                <gwtk-button
                    primary
                    class="my-4"
                    width-available
                    :title="$t( 'auth.Next' )"
                    :disabled="passwordNew!==passwordRepeat || passwordNew===''"
                    @click="sendPasswordNew"
                />
                <v-divider class="gwtk-auth-divider" />
                <a href="#" @click="gotoLoginForm">{{ $t('auth.Go to login page') }}</a>
            </v-form>
            <v-form v-if="isPasswordChangedSuccessForm">
                <v-col align="center" class="gwtk-auth-title">
                    {{ $t('auth.Password changed') }}
                </v-col>
                <v-col>
                    {{ $t('auth.Your password has been successfully changed') }}
                </v-col>
                <gwtk-button
                    secondary
                    class="my-4"
                    width-available
                    :title="$t( 'auth.Close' )"
                    @click="gotoLoginForm"
                />
                <v-divider class="gwtk-auth-divider" />
                <a href="#" @click="gotoLoginForm">{{ $t('auth.Go to login page') }}</a>
            </v-form>
        </gwtk-task-card>
    </v-overlay>
</template>

<script lang="ts" src="./GwtkAuthComponentWidget.ts" />

<style scoped>
    .mobile {
        position: fixed;
    }

    .gwtk-auth-window > div > form {
        padding-right: 16px;
        padding-left: 16px;
    }

    .gwtk-auth-login-image {
        width: 64px;
        height: 64px;
        background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAC4jAAAuIwF4pT92AAAFyWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgMTE2LjE2NDc2NiwgMjAyMS8wMi8xOS0yMzoxMDowNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIxLjIgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyMS0wOC0yM1QxNjozNDoyMyswMzowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wOC0yM1QxNjozNDoyMyswMzowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjEtMDgtMjNUMTY6MzQ6MjMrMDM6MDAiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MzFiZGEwM2UtMTlkNi03NDQxLWEzMmItNjU1Yzc0MjA5YzRkIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6NGIzYWJkNDgtMWMxYy04MDQ4LTk2ZmUt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");
        margin-left: auto;
        margin-right: auto;
    }

    .gwtk-auth-title {
        font-size: 1.4em;
        font-weight: bold;
    }

    .gwtk-auth-divider {
        margin: 1em 0;
    }

    a:visited {
        color:  var(--v-primary-base);
    }
</style>
