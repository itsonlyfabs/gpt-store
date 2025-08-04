-- Create email_automations table
CREATE TABLE IF NOT EXISTS public.email_automations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('signup', 'subscription_upgrade', 'subscription_downgrade', 'product_purchase')),
    trigger_conditions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create automation_emails table to link automations with email sequences
CREATE TABLE IF NOT EXISTS public.automation_emails (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    automation_id UUID REFERENCES public.email_automations(id) ON DELETE CASCADE,
    email_id UUID REFERENCES public.emails(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    delay_hours INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(automation_id, sequence_order)
);

-- Create user_automation_events table to track which users have received which automation emails
CREATE TABLE IF NOT EXISTS public.user_automation_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    automation_id UUID REFERENCES public.email_automations(id) ON DELETE CASCADE,
    email_id UUID REFERENCES public.emails(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, automation_id, email_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_automations_trigger_type ON public.email_automations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_email_automations_active ON public.email_automations(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_emails_automation_id ON public.automation_emails(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_emails_sequence_order ON public.automation_emails(sequence_order);
CREATE INDEX IF NOT EXISTS idx_user_automation_events_user_id ON public.user_automation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_automation_events_status ON public.user_automation_events(status);
CREATE INDEX IF NOT EXISTS idx_user_automation_events_scheduled_at ON public.user_automation_events(scheduled_at);

-- Enable RLS
ALTER TABLE public.email_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_automation_events ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.email_automations TO authenticated;
GRANT ALL ON public.automation_emails TO authenticated;
GRANT ALL ON public.user_automation_events TO authenticated;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION handle_automation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_email_automations_updated_at
    BEFORE UPDATE ON public.email_automations
    FOR EACH ROW EXECUTE FUNCTION handle_automation_updated_at();

CREATE TRIGGER handle_automation_emails_updated_at
    BEFORE UPDATE ON public.automation_emails
    FOR EACH ROW EXECUTE FUNCTION handle_automation_updated_at();

CREATE TRIGGER handle_user_automation_events_updated_at
    BEFORE UPDATE ON public.user_automation_events
    FOR EACH ROW EXECUTE FUNCTION handle_automation_updated_at();

-- Insert default signup automation
INSERT INTO public.email_automations (name, trigger_type, trigger_conditions) 
VALUES ('Welcome Series', 'signup', '{"subscription_types": ["FREE", "PRO"]}'); 