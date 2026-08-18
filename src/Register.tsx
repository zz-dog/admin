import { useState } from 'react'
import { useNavigate } from 'react-router'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { z } from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { register } from '@/services/auth'
import { saveAuth } from '@/lib/auth'

const registerSchema = z
  .object({
    username: z.string().trim().min(1, '请输入用户名'),
    email: z
      .string()
      .trim()
      .min(1, '请输入邮箱')
      .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), '邮箱格式不正确'),
    password: z.string().min(6, '密码至少 6 位'),
    confirm: z.string().min(1, '请再次输入密码'),
    agreed: z.boolean().refine((v) => v, '请先阅读并同意服务条款'),
  })
  .refine((v) => v.confirm === v.password, {
    path: ['confirm'],
    message: '两次输入的密码不一致',
  })

type RegisterFormValues = z.infer<typeof registerSchema>

interface RegisterProps {
  onSuccess?: (username: string) => void
}

function Register({ onSuccess }: RegisterProps) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirm: '',
      agreed: false,
    },
  })
  const loading = form.formState.isSubmitting
  const formError = form.formState.errors.root?.message

  async function onSubmit(values: RegisterFormValues) {
    try {
      const result = await register({
        username: values.username,
        email: values.email,
        password: values.password,
      })
      // 注册成功即视为登录
      saveAuth(result.token, result.username)
      onSuccess?.(result.username)
      navigate('/', { replace: true })
    } catch (e) {
      form.setError('root', {
        message: e instanceof Error ? e.message : '注册失败,请稍后重试',
      })
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">创建账号</CardTitle>
          <CardDescription>注册一个新账号开始使用</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {formError && (
                <Field data-invalid>
                  <FieldError>{formError}</FieldError>
                </Field>
              )}

              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="username">用户名</FieldLabel>
                    <Input
                      {...field}
                      id="username"
                      type="text"
                      placeholder="请输入用户名"
                      autoComplete="username"
                      aria-invalid={fieldState.invalid}
                      autoFocus
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">邮箱</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password">密码</FieldLabel>
                    <div className="relative">
                      <Input
                        {...field}
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="至少 6 位"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? '隐藏密码' : '显示密码'}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOffIcon data-icon="inline-end" />
                        ) : (
                          <EyeIcon data-icon="inline-end" />
                        )}
                      </button>
                    </div>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="confirm"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="confirm">确认密码</FieldLabel>
                    <Input
                      {...field}
                      id="confirm"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="再次输入密码"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Controller
                name="agreed"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="agree"
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                        className="mt-0.5"
                        aria-invalid={fieldState.invalid}
                      />
                      <label htmlFor="agree" className="text-sm leading-5">
                        我已阅读并同意{' '}
                        <a
                          href="#terms"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          服务条款
                        </a>
                      </label>
                    </div>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Spinner data-icon="inline-start" />}
                {loading ? '注册中…' : '注 册'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-sm">
            已有账号?
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => navigate('/login')}
            >
              去登录
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Register
