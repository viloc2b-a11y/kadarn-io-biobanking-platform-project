-- ============================================================================
-- KADARN PLATFORM — Sprint 0A: Core Identity & Organizations
-- ============================================================================
-- Target: PostgreSQL 15+ (Supabase compatible)
-- Domain: Multi-tenant biospecimen infrastructure (BNOS)
-- Design: ADR-002 — Multi-Tenant Architecture & Organization-Capability Model
-- Blueprint: docs/architecture/kadarn-platform-blueprint.md
-- Dependencies: none (foundational migration)
--
-- This migration creates the identity and organization layer that all
-- other modules build upon. Every organization is a legal entity with
-- capabilities (many-to-many), memberships (users), and roles.
-- ============================================================================

-- ############################################################################
-- PART 0: EXTENSION SAFETY
-- ################################################################------------

-- pgcrypto is needed for password hashing by admin_create_user.
-- Supabase comes with pgcrypto pre-installed in the extensions schema.
-- The function references extensions.crypt() which is available via search path.

-- pg_trgm supports fuzzy text search on organization names.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- ############################################################################
-- PART 1: ENUMS
-- ############################################################################

-- Visibility scope for multi-tenant data isolation (Blueprint §4.2)
DO $$ BEGIN
    CREATE TYPE visibility_scope AS ENUM (
        'organization',     -- visible only within the owning org
        'program',          -- visible to program participants
        'network',          -- visible to all authenticated users
        'public'            -- visible to unauthenticated users
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Membership lifecycle (Blueprint §5.3)
DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM (
        'invited',
        'active',
        'suspended',
        'inactive'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Identity provider types (Blueprint §4.4 — OIDC-ready abstraction)
DO $$ BEGIN
    CREATE TYPE identity_provider_type AS ENUM (
        'supabase',
        'azure_ad',
        'okta',
        'keycloak',
        'auth0',
        'google_workspace',
        'custom_oidc'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- PART 2: TABLE — organizations
-- ############################################################################
--
-- A legal entity that participates in the Kadarn network.
-- No rigid type enum — capabilities define what an org can do.
-- (Blueprint §5.1, ADR-002)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name                TEXT NOT NULL,
    legal_name          TEXT,                          -- registered legal name
    tax_id              TEXT,                          -- EIN / VAT
    country             CHAR(2) NOT NULL DEFAULT 'US', -- ISO 3166-1 alpha2
    region              TEXT,                          -- state / province

    -- Contact
    email               TEXT,
    phone               TEXT,
    website             TEXT,
    address_line1       TEXT,
    address_line2       TEXT,
    city                TEXT,
    postal_code         TEXT,

    -- Profile
    description         TEXT,
    logo_url            TEXT,
    certifications      TEXT[] DEFAULT '{}',
    metadata            JSONB DEFAULT '{}',

    -- Audit & lifecycle
    is_active           BOOLEAN NOT NULL DEFAULT true,
    -- References auth.users.id logically. No physical FK to avoid Supabase auth schema coupling.
    created_by          UUID NOT NULL,
    visibility_scope    visibility_scope NOT NULL DEFAULT 'network',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_country
    ON public.organizations(country);
CREATE INDEX IF NOT EXISTS idx_organizations_active
    ON public.organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_visibility
    ON public.organizations(visibility_scope);
CREATE INDEX IF NOT EXISTS idx_organizations_name_trgm
    ON public.organizations USING GIN (name gin_trgm_ops);

ALTER TABLE public.organizations
    ADD CONSTRAINT uq_organizations_name_country
    UNIQUE (name, country);

COMMENT ON TABLE public.organizations IS
    'Legal entities in Kadarn. Uses capability model (not type enum) per ADR-002.';

-- ############################################################################
-- PART 3: TABLE — organization_capability_types
-- ############################################################################
--
-- Controlled vocabulary of capabilities. Managed by platform administrators.
-- (Blueprint §5.2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_capability_types (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key                 TEXT NOT NULL UNIQUE,          -- stable identifier, e.g. 'biobank'
    name                TEXT NOT NULL,                 -- human-readable label
    description         TEXT,
    category            TEXT,                          -- grouping: research, clinical, logistics, regulatory, technology
    is_active           BOOLEAN NOT NULL DEFAULT true,
    display_order       INTEGER NOT NULL DEFAULT 0,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.organization_capability_types IS
    'Controlled vocabulary of capabilities. Seeded with 12 standard types.';

-- Seed the 12 standard capability types (Blueprint §5.2)
INSERT INTO public.organization_capability_types (key, name, description, category, display_order) VALUES
    ('sponsor',              'Sponsor',              'Funds and oversees research programs',                    'research',    1),
    ('cro',                  'CRO',                  'Contract Research Organization managing study operations','research',    2),
    ('biobank',              'Biobank',              'Biospecimen repository with collection and storage',      'clinical',    3),
    ('clinical_site',        'Clinical Site',        'Patient-facing clinical research site',                   'clinical',    4),
    ('processing_lab',       'Processing Lab',       'Laboratory that processes biospecimens',                  'clinical',    5),
    ('storage_facility',     'Storage Facility',     'Long-term biospecimen storage facility',                  'clinical',    6),
    ('logistics_vendor',     'Logistics Vendor',     'Transportation and cold-chain logistics',                 'logistics',   7),
    ('irb',                  'IRB / Ethics Board',   'Institutional Review Board or ethics committee',          'regulatory',  8),
    ('regulatory_body',      'Regulatory Body',      'Government or regulatory agency',                         'regulatory',  9),
    ('diagnostic_lab',       'Diagnostic Lab',       'Clinical diagnostic laboratory',                          'clinical',   10),
    ('data_processor',       'Data Processor',       'Handles data analysis, curation, or integration',         'technology', 11),
    ('technology_provider',  'Technology Provider',  'Provides software, platforms, or IT infrastructure',      'technology', 12)
ON CONFLICT (key) DO NOTHING;

-- ############################################################################
-- PART 4: TABLE — organization_capabilities
-- ############################################################################
--
-- Many-to-many: which organizations have which capabilities.
-- (Blueprint §5.1 — capability model)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_capabilities (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    capability_type_id  UUID NOT NULL REFERENCES public.organization_capability_types(id) ON DELETE RESTRICT,

    is_primary          BOOLEAN NOT NULL DEFAULT false,
    accredited_until    DATE,
    scope_description   TEXT,

    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (organization_id, capability_type_id)
);

CREATE INDEX IF NOT EXISTS idx_org_capabilities_org
    ON public.organization_capabilities(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_capabilities_type
    ON public.organization_capabilities(capability_type_id);
CREATE INDEX IF NOT EXISTS idx_org_capabilities_primary
    ON public.organization_capabilities(organization_id, is_primary)
    WHERE is_primary = true;

COMMENT ON TABLE public.organization_capabilities IS
    'Which capabilities each organization has. Many-to-many per ADR-002.';

-- ############################################################################
-- PART 5: TABLE — organization_roles
-- ############################################################################
--
-- Role definitions within an organization. (Blueprint §5.3)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_roles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key                 TEXT NOT NULL UNIQUE,
    name                TEXT NOT NULL,
    description         TEXT,
    is_system_role      BOOLEAN NOT NULL DEFAULT false,
    priority            INTEGER NOT NULL DEFAULT 0,    -- higher = more privileged

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.organization_roles IS
    'Role definitions. System roles: org_admin, org_member, readonly, etc.';

-- Seed system roles (Blueprint §5.3)
INSERT INTO public.organization_roles (key, name, description, is_system_role, priority) VALUES
    ('org_admin',      'Organization Admin',  'Full administrative access within the organization',        true, 100),
    ('org_member',     'Organization Member', 'Standard member with role-based permissions',               true,  50),
    ('biobank_tech',   'Biobank Technician',  'Manages biospecimen inventory and processing',              true,  60),
    ('irb_chair',      'IRB Chair',           'Oversees ethics review for the organization',               true,  70),
    ('data_steward',   'Data Steward',        'Manages data sharing policies and access',                  true,  65),
    ('readonly',       'Read Only',           'Can view organization data but not modify',                 true,  10)
ON CONFLICT (key) DO NOTHING;

-- ############################################################################
-- PART 6: TABLE — organization_memberships
-- ############################################################################
--
-- Which users belong to which organizations. A user can belong to multiple.
-- (Blueprint §4.3 — RLS architecture, §5 — Organization-Capability Model)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_memberships (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,                   -- FK to auth.users
    organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- References auth.users.id logically. No physical FK to avoid Supabase auth schema coupling.
    title               TEXT,
    department          TEXT,
    status              membership_status NOT NULL DEFAULT 'invited',

    invited_by          UUID,
    invited_at          TIMESTAMPTZ,
    joined_at           TIMESTAMPTZ,
    deactivated_at      TIMESTAMPTZ,
    deactivated_reason  TEXT,

    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_org_memberships_user
    ON public.organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org
    ON public.organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_status
    ON public.organization_memberships(status);

COMMENT ON TABLE public.organization_memberships IS
    'Links users to organizations. A user can belong to multiple organizations.';

-- ############################################################################
-- PART 7: TABLE — membership_roles
-- ############################################################################
--
-- Junction: each membership can have multiple roles within the org.
-- (Blueprint §5.3)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.membership_roles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id       UUID NOT NULL REFERENCES public.organization_memberships(id) ON DELETE CASCADE,
    role_id             UUID NOT NULL REFERENCES public.organization_roles(id) ON DELETE RESTRICT,

    assigned_by         UUID,
    assigned_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ,

    UNIQUE (membership_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_membership_roles_membership
    ON public.membership_roles(membership_id);
CREATE INDEX IF NOT EXISTS idx_membership_roles_role
    ON public.membership_roles(role_id);

COMMENT ON TABLE public.membership_roles IS
    'Which roles each membership has. A user can have multiple roles in an org.';

-- ############################################################################
-- PART 8: TABLE — identity_providers
-- ############################################################################
--
-- SSO / OIDC identity providers. Starts with Supabase Auth, supports migration
-- to Azure AD, Okta, etc. without changing the domain model.
-- (Blueprint §4.4 — OIDC-ready abstraction)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.identity_providers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_type       identity_provider_type NOT NULL,
    provider_name       TEXT NOT NULL,
    issuer_url          TEXT,
    client_id           TEXT,                            -- stored encrypted in production
    is_active           BOOLEAN NOT NULL DEFAULT true,
    config              JSONB DEFAULT '{}',

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.identity_providers IS
    'SSO/OIDC identity providers. Kadarn starts with Supabase Auth.';

-- Seed default Supabase provider
INSERT INTO public.identity_providers (provider_type, provider_name, is_active)
VALUES ('supabase', 'Kadarn Supabase Auth', true)
ON CONFLICT DO NOTHING;

-- ############################################################################
-- PART 9: TABLE — user_profiles
-- ############################################################################
--
-- Kadarn user identity layer. Linked 1:1 to auth.users. OIDC-ready.
-- (Blueprint §4.4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id                  UUID PRIMARY KEY,                -- same as auth.users.id
    email               TEXT NOT NULL,
    full_name           TEXT NOT NULL DEFAULT 'User',
    preferred_name      TEXT,
    avatar_url          TEXT,

    -- Identity provider link
    primary_identity_provider_id UUID REFERENCES public.identity_providers(id) ON DELETE SET NULL,
    external_identity_id         TEXT,

    -- Account status
    is_active           BOOLEAN NOT NULL DEFAULT true,
    last_sign_in_at     TIMESTAMPTZ,
    locale              TEXT DEFAULT 'en',
    timezone            TEXT DEFAULT 'UTC',

    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email
    ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active
    ON public.user_profiles(is_active);

COMMENT ON TABLE public.user_profiles IS
    'Kadarn user profiles. Linked 1:1 to auth.users. OIDC-ready.';

-- ############################################################################
-- PART 10: TABLE — external_identity_links
-- ############################################################################
--
-- Links a Kadarn user profile to external identity provider accounts.
-- Enables multi-SSO for the same Kadarn account.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.external_identity_links (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id         UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    identity_provider_id    UUID NOT NULL REFERENCES public.identity_providers(id) ON DELETE CASCADE,
    external_user_id        TEXT NOT NULL,
    external_email          TEXT,
    external_username       TEXT,
    raw_attributes          JSONB DEFAULT '{}',
    linked_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_authenticated_at   TIMESTAMPTZ,

    UNIQUE (identity_provider_id, external_user_id)
);

CREATE INDEX IF NOT EXISTS idx_external_links_profile
    ON public.external_identity_links(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_external_links_provider
    ON public.external_identity_links(identity_provider_id);

COMMENT ON TABLE public.external_identity_links IS
    'Links Kadarn user profiles to external SSO accounts. Multi-SSO support.';

-- ############################################################################
-- PART 11: UPDATED_AT HELPER FUNCTION
-- ############################################################################
--
-- Idempotent: safe to re-run across migrations.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ############################################################################
-- PART 12: TRIGGERS — updated_at
-- ############################################################################

CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_org_capabilities_updated_at
    BEFORE UPDATE ON public.organization_capabilities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_org_memberships_updated_at
    BEFORE UPDATE ON public.organization_memberships
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ############################################################################
-- PART 13: AUTO-CREATE PROFILE ON SIGNUP (Supabase Auth hook)
-- ############################################################################
--
-- Creates a user_profiles row when a user signs up via Supabase Auth.
-- (Blueprint §19.2 — migration rules: idempotent)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, metadata)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email, 'User'),
        jsonb_build_object(
            'signup_provider', NEW.raw_user_meta_data ->> 'provider'
        )
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_signup();

-- ############################################################################
-- PART 14: JWT CLAIM SYNC — user_profiles → auth.users → JWT
-- ############################################################################
--
-- Syncs selected profile fields into auth.users raw_app_meta_data so JWT
-- tokens include them on next refresh. (Blueprint §4.3 — RLS fast path)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_profile_to_auth_meta()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
        'kadarn_profile_id', NEW.id::text,
        'kadarn_email', NEW.email,
        'kadarn_name', NEW.full_name,
        'kadarn_active', NEW.is_active
    )
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_profiles_auth_sync ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_auth_sync
    AFTER INSERT OR UPDATE OF email, full_name, is_active ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_to_auth_meta();

-- ############################################################################
-- PART 15: ADMIN USER CREATION FUNCTION
-- ############################################################################
--
-- Helper for seeding and admin dashboard. Creates auth.users + profile
-- + optional organization membership in one call.
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
    -- Only service_role or superuser may directly create users
    -- Allow null or empty auth context (direct psql/superuser access)
    IF auth.role() IS DISTINCT FROM NULL
       AND auth.role() != ''
       AND auth.role() != 'service_role'
       AND auth.role() != 'superuser' THEN
        RAISE EXCEPTION 'Only service_role can create users directly';
    END IF;

    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        aud, role, is_sso_user, is_anonymous, created_at, updated_at
    ) VALUES (
        v_user_id,
        p_email,
        extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
        now(),
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

    -- Create identity entry (required by Supabase Auth for password sign-in)
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

    -- Ensure profile exists (trigger handles this, but safeguard)
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (v_user_id, p_email, p_full_name)
    ON CONFLICT (id) DO NOTHING;

    -- Create active membership if organization specified
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

-- ############################################################################
-- PART 16: VERIFICATION FUNCTION
-- ############################################################################

CREATE OR REPLACE FUNCTION public.my_auth_context()
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $$
    SELECT jsonb_build_object(
        'user_id', auth.uid(),
        'is_authenticated', auth.role() = 'authenticated',
        'jwt_payload', auth.jwt()
    );
$$;

-- ============================================================================
-- END OF MIGRATION 008 — Sprint 0A: Core Identity & Organizations
-- ============================================================================
