type UserData = {
    block: string;
    email: string;
    id: string;
    login: string;
    permissions: {
        create: boolean;
        delete: boolean;
        edit: boolean;
        operation_cancel: boolean;
        proj_manager: boolean;
    };
};

type ErrorData = {
    code: number;
    message: string;
};


export type LoginRequest = {
    login: string;
    password: string;
}

export type LoginSuccessResponse = {
    data: {
        authType: string;
        loginData: true;
        userData: UserData;
    };
};

export type LoginErrorResponse = {
    data: {
        authType: string;
        loginData: false;
        msg: string;
        userData: undefined; // на самом деле параметр вообще не приходит
    };
}


export type ChangePasswordRequest = {
    email: string;
}

export type CheckRecoveryCodeRequest = {
    code: string;
    email: string;
}

export type RecoveryCodeResponse = {
    data: {
        result: boolean;
    }
};


export type SetNewPasswordRequest = {
    email: string;
    code: string;
    password: string;
    passwordRepeat: string;
}

export type SetNewPasswordResponse = {
    data: {
        result: boolean;
    }
};


export type RegisterRequest = {
    login: string;
    email: string;
    password: string;
    passwordRepeat: string;
}

export type RegisterSuccessResponse = {
    data: {
        register: boolean;
    };
};


export type LogoutSuccessResponse = {
    data: {
        logout: true;
    };
    errorCode: ErrorData;
};


export type FetchSuccessResponse = {
    data: {
        authParams: {
            data: {
                authType: string;
                userData: UserData;
            };
        };
    };
};

export type FetchErrorResponse = {
    data: {
        authParams: {
            data: {
                authType: string;
                userData: undefined; // на самом деле параметр вообще не приходит
            };
        };
    };
};