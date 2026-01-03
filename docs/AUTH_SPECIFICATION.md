# Supabase Auth Specification

## Overview

Полная спецификация аутентификации на базе Supabase Auth.

---

## Auth Flows

### 1. Регистрация (Sign Up)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Register   │────▶│  Supabase   │────▶│ Email sent  │────▶│  Confirm    │
│    Form     │     │   signUp    │     │ (confirm)   │     │   Email     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                                              ┌─────────────┐     ┌─────────────┐
                                              │  Dashboard  │◀────│  Callback   │
                                              │   (logged)  │     │   Page      │
                                              └─────────────┘     └─────────────┘
```

**Шаги:**
1. Пользователь заполняет форму регистрации
2. Вызов `supabase.auth.signUp({ email, password })`
3. Supabase отправляет confirmation email
4. Показываем сообщение "Проверьте email"
5. Пользователь кликает ссылку в email
6. Redirect на `/auth/callback` с токеном
7. Callback page обрабатывает токен и создаёт сессию
8. Redirect на `/dashboard`

### 2. Вход (Sign In)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────▶│  Supabase   │────▶│  Dashboard  │
│    Form     │     │ signInWith  │     │  (logged)   │
│             │     │  Password   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Шаги:**
1. Пользователь вводит email и пароль
2. Вызов `supabase.auth.signInWithPassword({ email, password })`
3. При успехе — redirect на `/dashboard`
4. При ошибке — показать toast с сообщением

### 3. Восстановление пароля

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Forgot    │────▶│  Supabase   │────▶│ Email sent  │────▶│   Reset     │
│  Password   │     │  resetPwd   │     │ (reset)     │     │  Password   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                                              ┌─────────────┐     ┌─────────────┐
                                              │   Login     │◀────│  Supabase   │
                                              │   Page      │     │  updateUser │
                                              └─────────────┘     └─────────────┘
```

**Шаги:**
1. Пользователь вводит email на странице Forgot Password
2. Вызов `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
3. Supabase отправляет email со ссылкой
4. Показываем "Ссылка отправлена на email"
5. Пользователь кликает ссылку
6. Redirect на `/auth/reset-password` с токеном в URL
7. Callback обрабатывает токен, создаёт сессию
8. Пользователь вводит новый пароль
9. Вызов `supabase.auth.updateUser({ password })`
10. При успехе — redirect на `/auth/login`

### 4. Смена email

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Settings   │────▶│  Supabase   │────▶│ Email sent  │────▶│  Callback   │
│  (change    │     │ updateUser  │     │ to BOTH     │     │   Page      │
│   email)    │     │ {email:new} │     │ addresses   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**Шаги:**
1. Пользователь на странице Settings вводит новый email
2. Вызов `supabase.auth.updateUser({ email: newEmail })`
3. Supabase отправляет confirmation на ОБА email (старый и новый)
4. Пользователь подтверждает оба email
5. Email обновлён

### 5. Смена пароля (залогиненный пользователь)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Settings   │────▶│  Supabase   │────▶│  Success    │
│  (change    │     │ updateUser  │     │  Toast      │
│  password)  │     │ {password}  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 6. Выход (Sign Out)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Header    │────▶│  Supabase   │────▶│   Login     │
│  (logout)   │     │  signOut    │     │   Page      │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Routes

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/auth/login` | LoginPage | No | Вход |
| `/auth/register` | RegisterPage | No | Регистрация |
| `/auth/forgot-password` | ForgotPasswordPage | No | Запрос сброса пароля |
| `/auth/reset-password` | ResetPasswordPage | No* | Установка нового пароля |
| `/auth/callback` | CallbackPage | No | Обработка email ссылок |
| `/auth/confirm` | ConfirmPage | No | Страница "проверьте email" |

> *Reset Password требует валидного токена в URL (приходит из email)

---

## Callback Page

**Критически важная страница** — обрабатывает все redirects от Supabase.

### URL параметры от Supabase

```
/auth/callback#access_token=xxx&refresh_token=xxx&type=signup
/auth/callback#access_token=xxx&refresh_token=xxx&type=recovery
/auth/callback#access_token=xxx&refresh_token=xxx&type=email_change
/auth/callback?error=xxx&error_description=xxx
```

### Логика обработки

```typescript
// src/features/auth/pages/CallbackPage.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const handleCallback = async () => {
      // Проверяем ошибки в URL
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      
      if (error) {
        toast.error(errorDescription || 'Ошибка авторизации');
        navigate('/auth/login');
        return;
      }
      
      // Получаем хэш-параметры (Supabase использует hash для токенов)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      // Supabase автоматически обрабатывает токены при загрузке страницы
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Не удалось подтвердить');
        navigate('/auth/login');
        return;
      }
      
      // Redirect в зависимости от типа
      switch (type) {
        case 'signup':
          toast.success('Email подтверждён! Добро пожаловать!');
          navigate('/dashboard');
          break;
        case 'recovery':
          // Для recovery — redirect на страницу смены пароля
          navigate('/auth/reset-password');
          break;
        case 'email_change':
          toast.success('Email успешно изменён!');
          navigate('/settings');
          break;
        default:
          navigate('/dashboard');
      }
    };
    
    handleCallback();
  }, [navigate, searchParams]);
  
  return <LoadingSpinner />;
}
```

---

## Auth State Management

### onAuthStateChange Listener

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// src/app/providers.tsx
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '@/lib/supabase';
import { setUser, clearUser } from '@/features/auth/authSlice';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Получить начальную сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        dispatch(setUser(session.user));
      }
    });
    
    // Слушать изменения auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);
        
        switch (event) {
          case 'SIGNED_IN':
            dispatch(setUser(session?.user ?? null));
            break;
          case 'SIGNED_OUT':
            dispatch(clearUser());
            break;
          case 'TOKEN_REFRESHED':
            // Токен обновлён автоматически
            break;
          case 'USER_UPDATED':
            dispatch(setUser(session?.user ?? null));
            break;
          case 'PASSWORD_RECOVERY':
            // Пользователь перешёл по ссылке восстановления
            break;
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);
  
  return <>{children}</>;
}
```

### Auth Events

| Event | Когда срабатывает |
|-------|-------------------|
| `INITIAL_SESSION` | При первой загрузке |
| `SIGNED_IN` | Успешный вход |
| `SIGNED_OUT` | Выход |
| `TOKEN_REFRESHED` | Токен обновлён |
| `USER_UPDATED` | Данные пользователя изменены |
| `PASSWORD_RECOVERY` | Переход по ссылке восстановления |

---

## Supabase Configuration

### Redirect URLs (Dashboard)

В Supabase Dashboard → Authentication → URL Configuration:

| URL | Описание |
|-----|----------|
| `http://localhost:5173` | Site URL (dev) |
| `http://localhost:5173/auth/callback` | Redirect URL для callbacks |
| `https://yourapp.com` | Site URL (prod) |
| `https://yourapp.com/auth/callback` | Redirect URL (prod) |

### Email Templates (Dashboard)

Настроить в Supabase Dashboard → Authentication → Email Templates:

| Template | Описание | Redirect URL |
|----------|----------|--------------|
| Confirm signup | Подтверждение регистрации | `{{ .SiteURL }}/auth/callback` |
| Reset password | Сброс пароля | `{{ .SiteURL }}/auth/callback` |
| Change email | Смена email | `{{ .SiteURL }}/auth/callback` |

---

## Validation Schemas (Complete)

### Login Schema
```typescript
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'auth.validation.email_required' })
    .email({ message: 'auth.validation.email_invalid' }),
  password: z
    .string()
    .min(1, { message: 'auth.validation.password_required' })
    .min(6, { message: 'auth.validation.password_min_6' }),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

### Register Schema
```typescript
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: 'auth.validation.email_required' })
      .email({ message: 'auth.validation.email_invalid' }),
    password: z
      .string()
      .min(1, { message: 'auth.validation.password_required' })
      .min(8, { message: 'auth.validation.password_min_8' })
      .regex(/[A-Z]/, { message: 'auth.validation.password_uppercase' })
      .regex(/[a-z]/, { message: 'auth.validation.password_lowercase' })
      .regex(/[0-9]/, { message: 'auth.validation.password_digit' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'auth.validation.confirm_password_required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.validation.passwords_mismatch',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
```

### Forgot Password Schema
```typescript
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'auth.validation.email_required' })
    .email({ message: 'auth.validation.email_invalid' }),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
```

### Reset Password Schema
```typescript
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, { message: 'auth.validation.password_required' })
      .min(8, { message: 'auth.validation.password_min_8' })
      .regex(/[A-Z]/, { message: 'auth.validation.password_uppercase' })
      .regex(/[a-z]/, { message: 'auth.validation.password_lowercase' })
      .regex(/[0-9]/, { message: 'auth.validation.password_digit' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'auth.validation.confirm_password_required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.validation.passwords_mismatch',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
```

### Change Email Schema
```typescript
export const changeEmailSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'auth.validation.email_required' })
    .email({ message: 'auth.validation.email_invalid' }),
});

export type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;
```

### Change Password Schema (Logged in user)
```typescript
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: 'auth.validation.current_password_required' }),
    newPassword: z
      .string()
      .min(1, { message: 'auth.validation.password_required' })
      .min(8, { message: 'auth.validation.password_min_8' })
      .regex(/[A-Z]/, { message: 'auth.validation.password_uppercase' })
      .regex(/[a-z]/, { message: 'auth.validation.password_lowercase' })
      .regex(/[0-9]/, { message: 'auth.validation.password_digit' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'auth.validation.confirm_password_required' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'auth.validation.passwords_mismatch',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
```

---

## Error Handling

### Supabase Auth Errors

| Error Code | Message | Описание |
|------------|---------|----------|
| `invalid_credentials` | Invalid login credentials | Неверный email или пароль |
| `email_not_confirmed` | Email not confirmed | Email не подтверждён |
| `user_already_exists` | User already registered | Пользователь уже существует |
| `weak_password` | Password is too weak | Слабый пароль |
| `same_password` | New password must be different | Новый пароль = старый |
| `over_email_send_rate_limit` | Too many emails sent | Лимит отправки email |
| `signup_disabled` | Signups not allowed | Регистрация отключена |

### Error Mapping (i18n)

```typescript
// src/features/auth/utils/errorMessages.ts
export function getAuthErrorMessage(error: AuthError): string {
  const errorMap: Record<string, string> = {
    'invalid_credentials': 'auth.errors.invalid_credentials',
    'email_not_confirmed': 'auth.errors.email_not_confirmed',
    'user_already_exists': 'auth.errors.user_already_exists',
    'weak_password': 'auth.errors.weak_password',
    'same_password': 'auth.errors.same_password',
    'over_email_send_rate_limit': 'auth.errors.rate_limit',
  };
  
  return errorMap[error.code] || 'auth.errors.unknown';
}
```

---

## i18n Keys (auth namespace)

```json
{
  "auth": {
    "login": {
      "title": "Вход",
      "email": "Email",
      "password": "Пароль",
      "remember_me": "Запомнить меня",
      "submit": "Войти",
      "forgot_password": "Забыли пароль?",
      "no_account": "Нет аккаунта?",
      "register": "Зарегистрироваться"
    },
    "register": {
      "title": "Регистрация",
      "email": "Email",
      "password": "Пароль",
      "confirm_password": "Подтвердите пароль",
      "submit": "Зарегистрироваться",
      "have_account": "Уже есть аккаунт?",
      "login": "Войти",
      "success": "Проверьте вашу почту для подтверждения"
    },
    "forgot_password": {
      "title": "Восстановление пароля",
      "description": "Введите email для получения ссылки сброса",
      "email": "Email",
      "submit": "Отправить ссылку",
      "back_to_login": "Вернуться к входу",
      "success": "Ссылка отправлена на ваш email"
    },
    "reset_password": {
      "title": "Новый пароль",
      "password": "Новый пароль",
      "confirm_password": "Подтвердите пароль",
      "submit": "Сохранить пароль",
      "success": "Пароль успешно изменён"
    },
    "validation": {
      "email_required": "Email обязателен",
      "email_invalid": "Неверный формат email",
      "password_required": "Пароль обязателен",
      "password_min_6": "Минимум 6 символов",
      "password_min_8": "Минимум 8 символов",
      "password_uppercase": "Нужна заглавная буква",
      "password_lowercase": "Нужна строчная буква",
      "password_digit": "Нужна цифра",
      "confirm_password_required": "Подтвердите пароль",
      "passwords_mismatch": "Пароли не совпадают",
      "current_password_required": "Введите текущий пароль"
    },
    "errors": {
      "invalid_credentials": "Неверный email или пароль",
      "email_not_confirmed": "Email не подтверждён",
      "user_already_exists": "Пользователь уже зарегистрирован",
      "weak_password": "Слишком слабый пароль",
      "same_password": "Новый пароль должен отличаться",
      "rate_limit": "Слишком много попыток. Попробуйте позже",
      "unknown": "Произошла ошибка. Попробуйте снова"
    }
  }
}
```

---

## RTK Query Auth Endpoints (Complete)

```typescript
// src/services/authApi.ts
import { api } from './api';
import { supabase } from '@/lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface AuthResponse {
  user: User | null;
  session: Session | null;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials {
  email: string;
  password: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get current session
    getSession: builder.query<Session | null, void>({
      queryFn: async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) return { error: { message: error.message } };
        return { data: data.session };
      },
    }),

    // Get current user
    getUser: builder.query<User | null, void>({
      queryFn: async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error) return { error: { message: error.message } };
        return { data: data.user };
      },
    }),

    // Sign in with email/password
    signIn: builder.mutation<AuthResponse, SignInCredentials>({
      queryFn: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { error: { message: error.message, code: error.code } };
        return { data };
      },
      invalidatesTags: ['Profile'],
    }),

    // Sign up with email/password
    signUp: builder.mutation<AuthResponse, SignUpCredentials>({
      queryFn: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) return { error: { message: error.message, code: error.code } };
        return { data };
      },
    }),

    // Sign out
    signOut: builder.mutation<void, void>({
      queryFn: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) return { error: { message: error.message } };
        return { data: undefined };
      },
      invalidatesTags: ['Profile', 'Trade', 'Stats'],
    }),

    // Request password reset
    resetPasswordRequest: builder.mutation<void, string>({
      queryFn: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`,
        });
        if (error) return { error: { message: error.message, code: error.code } };
        return { data: undefined };
      },
    }),

    // Update password (after reset or logged in)
    updatePassword: builder.mutation<User, string>({
      queryFn: async (password) => {
        const { data, error } = await supabase.auth.updateUser({ password });
        if (error) return { error: { message: error.message, code: error.code } };
        return { data: data.user };
      },
    }),

    // Update email
    updateEmail: builder.mutation<User, string>({
      queryFn: async (email) => {
        const { data, error } = await supabase.auth.updateUser({
          email,
        });
        if (error) return { error: { message: error.message, code: error.code } };
        return { data: data.user };
      },
    }),

    // Resend confirmation email
    resendConfirmation: builder.mutation<void, string>({
      queryFn: async (email) => {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
        });
        if (error) return { error: { message: error.message, code: error.code } };
        return { data: undefined };
      },
    }),

    // Refresh session
    refreshSession: builder.mutation<Session | null, void>({
      queryFn: async () => {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) return { error: { message: error.message } };
        return { data: data.session };
      },
    }),
  }),
});

export const {
  useGetSessionQuery,
  useGetUserQuery,
  useSignInMutation,
  useSignUpMutation,
  useSignOutMutation,
  useResetPasswordRequestMutation,
  useUpdatePasswordMutation,
  useUpdateEmailMutation,
  useResendConfirmationMutation,
  useRefreshSessionMutation,
} = authApi;
```

---

## Protected Routes

```typescript
// src/components/common/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useGetSessionQuery } from '@/services/authApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, isLoading } = useGetSessionQuery();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    // Сохраняем текущий URL для redirect после логина
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

---

## Settings Page - Auth Section

### Смена пароля

```
┌─────────────────────────────────────────────────────────────┐
│ Безопасность                                                 │
├─────────────────────────────────────────────────────────────┤
│ Сменить пароль                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Текущий пароль: [____________]                          ││
│ │ Новый пароль:   [____________]                          ││
│ │ Подтвердите:    [____________]                          ││
│ │                                         [Сохранить]     ││
│ └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ Сменить email                                               │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Текущий email: user@example.com                         ││
│ │ Новый email:   [____________]                           ││
│ │                                         [Сохранить]     ││
│ │ ⚠️ На оба адреса будет отправлено подтверждение        ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Future: OAuth Providers

Для будущей реализации (не в MVP):

| Provider | Метод |
|----------|-------|
| Google | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| GitHub | `supabase.auth.signInWithOAuth({ provider: 'github' })` |

---

*Last updated: 2026-01-01*
