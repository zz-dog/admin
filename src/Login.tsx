import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
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
import { login } from '@/services/auth'
import { saveAuth } from '@/lib/auth'

const loginSchema = z.object({
  username: z.string().trim().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
  remember: z.boolean(),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginProps {
  onSuccess?: (username: string) => void
}

function Login({ onSuccess }: LoginProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', remember: false },
  })
  const loading = form.formState.isSubmitting
  const formError = form.formState.errors.root?.message

  async function onSubmit(values: LoginFormValues) {
    try {
      const result = await login(values)
      saveAuth(result.token, result.username)
      onSuccess?.(result.username)
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (e) {
      form.setError('root', {
        message: e instanceof Error ? e.message : '登录失败,请稍后重试',
      })
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">欢迎回来</CardTitle>
          <CardDescription>请登录你的账号继续</CardDescription>
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
                        placeholder="请输入密码"
                        autoComplete="current-password"
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <Controller
                    name="remember"
                    control={form.control}
                    render={({ field }) => (
                      <Checkbox
                        id="remember"
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    )}
                  />
                  记住我
                </label>
                <a
                  href="#forgot"
                  className="text-primary text-sm underline-offset-4 hover:underline"
                >
                  忘记密码?
                </a>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Spinner data-icon="inline-start" />}
                {loading ? '登录中…' : '登 录'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-sm">
            还没有账号?
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => navigate('/register')}
            >
              立即注册
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Login
