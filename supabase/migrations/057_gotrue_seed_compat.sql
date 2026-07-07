-- ============================================================================
-- Phase 8 Remediation S-1 — GoTrue compatibility for SQL-seeded auth users
-- Fixes existing rows + replaces admin_create_user for fresh seeds.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_create_user(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_organization_id UUID DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    IF auth.role() IS DISTINCT FROM NULL
       AND auth.role() != ''
       AND auth.role() != 'service_role'
       AND auth.role() != 'superuser' THEN
        RAISE EXCEPTION 'Only service_role can create users directly';
    END IF;

    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        email_change_token_current, reauthentication_token, phone_change, phone_change_token,
        raw_app_meta_data, raw_user_meta_data,
        aud, role, is_sso_user, is_anonymous, created_at, updated_at
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        p_email,
        extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
        now(),
        '', '', '', '',
        '', '', '', '',
        jsonb_build_object(
            'provider', 'email',
            'providers', ARRAY['email']
        ),
        jsonb_build_object(
            'full_name', p_full_name,
            'organization_id', p_organization_id::text
        ),
        'authenticated', 'authenticated',
        false, false,
        now(), now()
    );

    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
    ) VALUES (
        v_user_id, v_user_id,
        jsonb_build_object(
            'sub', v_user_id::text,
            'email', p_email,
            'email_verified', true,
            'full_name', p_full_name,
            'phone_verified', false
        ),
        'email', v_user_id::text,
        now(), now(), now()
    )
    ON CONFLICT (provider_id, provider) DO NOTHING;

    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (v_user_id, p_email, p_full_name)
    ON CONFLICT (id) DO NOTHING;

    IF p_organization_id IS NOT NULL THEN
        INSERT INTO public.organization_memberships (
            user_id, organization_id, status, invited_by, invited_at, joined_at
        ) VALUES (
            v_user_id, p_organization_id, 'active', v_user_id, now(), now()
        )
        ON CONFLICT (user_id, organization_id) DO NOTHING;
    END IF;

    RETURN v_user_id;
END;
$$;

UPDATE auth.users SET
    instance_id = COALESCE(instance_id, '00000000-0000-0000-0000-000000000000'::uuid),
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    reauthentication_token = COALESCE(reauthentication_token, ''),
    phone_change = COALESCE(phone_change, ''),
    phone_change_token = COALESCE(phone_change_token, '')
WHERE instance_id IS NULL
   OR confirmation_token IS NULL
   OR recovery_token IS NULL;
