'use client'

import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import type { JoinActorSlug } from '@/lib/join/actor-types'

interface OrganizationRegistrationFormProps {
  actorSlug: JoinActorSlug
  actorName: string
  actorDescription: string
}

interface FormValues {
  organizationName: string
  country: string
  website: string
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  termsAccepted: boolean
  privacyAcknowledged: boolean
}

type FieldErrors = Partial<Record<keyof FormValues, string>>

const initialValues: FormValues = {
  organizationName: '',
  country: '',
  website: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  termsAccepted: false,
  privacyAcknowledged: false,
}

export function OrganizationRegistrationForm({
  actorSlug,
  actorName,
  actorDescription,
}: OrganizationRegistrationFormProps) {
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)

  function updateValue<Key extends keyof FormValues>(key: Key, value: FormValues[Key]) {
    setValues(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined }))
    setSubmitted(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setSubmitted(Object.keys(nextErrors).length === 0)
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={formStyle}>
      <div style={introStyle}>
        <p style={eyebrowStyle}>Registration form</p>
        <h2 style={headingStyle}>{actorName}</h2>
        <p style={descriptionStyle}>{actorDescription}</p>
        <p style={safeModeStyle}>
          UI and validation only. This form does not create users, organizations,
          memberships, roles, API calls, or database records.
        </p>
      </div>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Organization</legend>
        <FormField
          label="Organization Name"
          error={errors.organizationName}
          input={
            <input
              name="organizationName"
              value={values.organizationName}
              onChange={event => updateValue('organizationName', event.target.value)}
              style={inputStyle(Boolean(errors.organizationName))}
              autoComplete="organization"
            />
          }
        />
        <FormField
          label="Organization Type"
          input={
            <input
              name="organizationType"
              value={actorName}
              readOnly
              data-actor-slug={actorSlug}
              style={readonlyInputStyle}
            />
          }
        />
        <FormField
          label="Country"
          error={errors.country}
          input={
            <input
              name="country"
              value={values.country}
              onChange={event => updateValue('country', event.target.value)}
              style={inputStyle(Boolean(errors.country))}
              autoComplete="country-name"
            />
          }
        />
        <FormField
          label="Website (optional)"
          error={errors.website}
          input={
            <input
              name="website"
              value={values.website}
              onChange={event => updateValue('website', event.target.value)}
              style={inputStyle(Boolean(errors.website))}
              inputMode="url"
              placeholder="https://example.org"
            />
          }
        />
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Administrator</legend>
        <div style={twoColumnStyle}>
          <FormField
            label="First Name"
            error={errors.firstName}
            input={
              <input
                name="firstName"
                value={values.firstName}
                onChange={event => updateValue('firstName', event.target.value)}
                style={inputStyle(Boolean(errors.firstName))}
                autoComplete="given-name"
              />
            }
          />
          <FormField
            label="Last Name"
            error={errors.lastName}
            input={
              <input
                name="lastName"
                value={values.lastName}
                onChange={event => updateValue('lastName', event.target.value)}
                style={inputStyle(Boolean(errors.lastName))}
                autoComplete="family-name"
              />
            }
          />
        </div>
        <FormField
          label="Email"
          error={errors.email}
          input={
            <input
              name="email"
              type="email"
              value={values.email}
              onChange={event => updateValue('email', event.target.value)}
              style={inputStyle(Boolean(errors.email))}
              autoComplete="email"
            />
          }
        />
        <div style={twoColumnStyle}>
          <FormField
            label="Password"
            error={errors.password}
            input={
              <input
                name="password"
                type="password"
                value={values.password}
                onChange={event => updateValue('password', event.target.value)}
                style={inputStyle(Boolean(errors.password))}
                autoComplete="new-password"
              />
            }
          />
          <FormField
            label="Confirm Password"
            error={errors.confirmPassword}
            input={
              <input
                name="confirmPassword"
                type="password"
                value={values.confirmPassword}
                onChange={event => updateValue('confirmPassword', event.target.value)}
                style={inputStyle(Boolean(errors.confirmPassword))}
                autoComplete="new-password"
              />
            }
          />
        </div>
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Legal</legend>
        <CheckboxField
          label="I accept the Kadarn terms for organization onboarding."
          checked={values.termsAccepted}
          error={errors.termsAccepted}
          onChange={checked => updateValue('termsAccepted', checked)}
        />
        <CheckboxField
          label="I acknowledge the Kadarn privacy notice for account and organization setup."
          checked={values.privacyAcknowledged}
          error={errors.privacyAcknowledged}
          onChange={checked => updateValue('privacyAcknowledged', checked)}
        />
      </fieldset>

      {submitted && (
        <p role="status" style={successStyle}>
          Provisioning will be implemented in PCP-1.1d.
        </p>
      )}

      <button type="submit" style={submitStyle}>
        Validate registration details
      </button>
    </form>
  )
}

function FormField({ label, input, error }: { label: string; input: ReactNode; error?: string }) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      {input}
      {error && <span style={errorStyle}>{error}</span>}
    </label>
  )
}

function CheckboxField({
  label,
  checked,
  error,
  onChange,
}: {
  label: string
  checked: boolean
  error?: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label style={checkboxStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        style={{ marginTop: 2 }}
      />
      <span>
        <span style={checkboxLabelStyle}>{label}</span>
        {error && <span style={errorStyle}>{error}</span>}
      </span>
    </label>
  )
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {}
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!values.organizationName.trim()) errors.organizationName = 'Organization name is required.'
  if (!values.country.trim()) errors.country = 'Country is required.'
  if (values.website.trim() && !isValidUrl(values.website.trim())) {
    errors.website = 'Enter a valid website URL.'
  }
  if (!values.firstName.trim()) errors.firstName = 'First name is required.'
  if (!values.lastName.trim()) errors.lastName = 'Last name is required.'
  if (!emailPattern.test(values.email.trim())) errors.email = 'Enter a valid email address.'
  if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.'
  if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords must match.'
  if (!values.termsAccepted) errors.termsAccepted = 'Terms acceptance is required.'
  if (!values.privacyAcknowledged) errors.privacyAcknowledged = 'Privacy acknowledgement is required.'

  return errors
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const introStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: 'var(--teal)',
  fontWeight: 800,
  letterSpacing: 0.8,
  textTransform: 'uppercase',
}

const headingStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 900,
  color: 'var(--tx)',
}

const descriptionStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.6,
  color: 'var(--txd)',
}

const safeModeStyle: CSSProperties = {
  margin: '6px 0 0',
  padding: 12,
  borderRadius: 10,
  border: '1px solid rgba(12,197,193,0.22)',
  background: 'rgba(12,197,193,0.08)',
  fontSize: 12,
  lineHeight: 1.5,
  color: 'var(--txd)',
}

const fieldsetStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  margin: 0,
  padding: 18,
  borderRadius: 14,
  border: '1px solid var(--border)',
}

const legendStyle: CSSProperties = {
  padding: '0 6px',
  fontSize: 13,
  fontWeight: 900,
  color: 'var(--tx)',
}

const twoColumnStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
}

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const labelStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--txd)',
  fontWeight: 700,
}

const inputStyle = (hasError: boolean): CSSProperties => ({
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: hasError ? '1px solid var(--red)' : '1px solid var(--border)',
  background: 'var(--navy3)',
  color: 'var(--tx)',
  fontSize: 14,
  outline: 'none',
})

const readonlyInputStyle: CSSProperties = {
  ...inputStyle(false),
  color: 'var(--txd)',
  cursor: 'not-allowed',
}

const checkboxStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  fontSize: 13,
  color: 'var(--txd)',
}

const checkboxLabelStyle: CSSProperties = {
  display: 'block',
  lineHeight: 1.45,
}

const errorStyle: CSSProperties = {
  display: 'block',
  fontSize: 12,
  lineHeight: 1.4,
  color: 'var(--red)',
}

const successStyle: CSSProperties = {
  margin: 0,
  padding: 14,
  borderRadius: 12,
  border: '1px solid rgba(12,197,193,0.32)',
  background: 'rgba(12,197,193,0.1)',
  color: 'var(--teal)',
  fontSize: 14,
  fontWeight: 800,
}

const submitStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--teal)',
  color: 'var(--navy)',
  fontSize: 14,
  fontWeight: 900,
  cursor: 'pointer',
}
