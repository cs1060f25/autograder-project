-- Add phone number and consent fields to users table
-- Phone numbers stored in E.164 format (e.g., +14155552671)

ALTER TABLE public.users
ADD COLUMN phone_number TEXT,
ADD COLUMN phone_consent BOOLEAN DEFAULT false,
ADD COLUMN phone_country_code TEXT DEFAULT 'US';

-- Add constraint to ensure phone_consent is true if phone_number is provided
ALTER TABLE public.users
ADD CONSTRAINT phone_consent_required 
CHECK (phone_number IS NULL OR (phone_number IS NOT NULL AND phone_consent = true));

-- Add index for phone number lookups
CREATE INDEX idx_users_phone_number ON public.users(phone_number) WHERE phone_number IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.users.phone_number IS 'User phone number in E.164 format (e.g., +14155552671)';
COMMENT ON COLUMN public.users.phone_consent IS 'User consent to be contacted via phone';
COMMENT ON COLUMN public.users.phone_country_code IS 'ISO 3166-1 alpha-2 country code for phone number';
