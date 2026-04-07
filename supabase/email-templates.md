# Fervet Supabase Email Templates

Configure these in Supabase Auth > Email Templates.

## Confirm signup

Subject:

`Welcome to Fervet — confirm your email`

Body:

```html
<p>Hi,</p>
<p>Thank you for joining Fervet.</p>
<p>To finish creating your account, please confirm your email by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>If you did not sign up for Fervet, you can safely ignore this email.</p>
<p>Welcome,<br />Fervet</p>
```

## Reset password

Subject:

`Reset your Fervet password`

Body:

```html
<p>Hi,</p>
<p>We received a request to reset your Fervet password.</p>
<p>Click the link below to choose a new password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you did not request this, you can safely ignore this email.</p>
```
