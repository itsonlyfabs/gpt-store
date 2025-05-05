-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users table is handled by Supabase Auth, but we'll create a profiles table
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    name text,
    email text unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products table
create table if not exists public.products (
    id uuid default uuid_generate_v4() primary key,
    name varchar(255) not null,
    description text not null,
    price integer not null, -- Price in cents
    category varchar(100) not null,
    thumbnail varchar(255) not null,
    price_type varchar(20) not null check (price_type in ('one_time', 'subscription')),
    currency varchar(3) not null default 'USD',
    features text[] not null default '{}',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Purchases table (for one-time purchases)
create table if not exists public.purchases (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade,
    product_id uuid references public.products on delete cascade,
    stripe_session_id varchar(255) not null,
    amount_paid integer not null, -- Amount in cents
    currency varchar(3) not null default 'USD',
    status varchar(50) not null default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, product_id)
);

-- Reviews table
create table if not exists public.reviews (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade,
    product_id uuid references public.products on delete cascade,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, product_id)
);

-- Subscriptions table
create table if not exists public.subscriptions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade,
    product_id uuid references public.products on delete cascade,
    stripe_subscription_id varchar(255) not null unique,
    status varchar(50) not null default 'active',
    current_period_start timestamp with time zone not null,
    current_period_end timestamp with time zone not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, product_id)
);

-- Credits table (for usage tracking)
create table if not exists public.credits (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users on delete cascade,
    product_id uuid references public.products on delete cascade,
    total_tokens integer not null default 0,
    total_chats integer not null default 0,
    last_chat_date timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, product_id)
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.purchases enable row level security;
alter table public.reviews enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credits enable row level security;

-- Drop existing policies
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Products are viewable by everyone" on public.products;
drop policy if exists "Purchases are viewable by the user who made them" on public.purchases;
drop policy if exists "Reviews are viewable by everyone" on public.reviews;
drop policy if exists "Users can create reviews" on public.reviews;
drop policy if exists "Users can update own reviews" on public.reviews;
drop policy if exists "Service role can manage purchases" on public.purchases;
drop policy if exists "Users can view their own purchases" on public.purchases;
drop policy if exists "Users cannot modify purchases" on public.purchases;
drop policy if exists "Users cannot delete purchases" on public.purchases;
drop policy if exists "Anyone can view products" on public.products;
drop policy if exists "Only service role can modify products" on public.products;
drop policy if exists "Users can view all reviews" on public.reviews;
drop policy if exists "Users can create reviews for purchased products" on public.reviews;
drop policy if exists "Users can update their own reviews" on public.reviews;
drop policy if exists "Users can delete their own reviews" on public.reviews;
drop policy if exists "Users can view their own subscriptions" on public.subscriptions;
drop policy if exists "Service role can manage subscriptions" on public.subscriptions;
drop policy if exists "Users can view their own credits" on public.credits;
drop policy if exists "Service role can manage credits" on public.credits;

-- Create policies
create policy "Public profiles are viewable by everyone"
    on public.profiles for select
    using (true);

create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id);

create policy "Products are viewable by everyone"
    on public.products for select
    using (true);

create policy "Purchases are viewable by the user who made them"
    on public.purchases for select
    using (auth.uid() = user_id);

create policy "Reviews are viewable by everyone"
    on public.reviews for select
    using (true);

create policy "Users can create reviews"
    on public.reviews for insert
    with check (auth.uid() = user_id);

create policy "Users can update own reviews"
    on public.reviews for update
    using (auth.uid() = user_id);

-- Purchases policies
create policy "Service role can manage purchases"
    on public.purchases for all
    using ( auth.jwt() ->> 'role' = 'service_role' )
    with check ( auth.jwt() ->> 'role' = 'service_role' );

create policy "Users can view their own purchases"
    on public.purchases for select
    using (auth.uid() = user_id);

create policy "Users cannot modify purchases"
    on public.purchases for update
    using (false);

create policy "Users cannot delete purchases"
    on public.purchases for delete
    using (false);

-- Products policies
create policy "Anyone can view products"
    on public.products for select
    using (true);

create policy "Only service role can modify products"
    on public.products for all
    using ( auth.jwt() ->> 'role' = 'service_role' )
    with check ( auth.jwt() ->> 'role' = 'service_role' );

-- Reviews policies
create policy "Users can view all reviews"
    on public.reviews for select
    using (true);

create policy "Users can create reviews for purchased products"
    on public.reviews for insert
    with check (
        exists (
            select 1 from public.purchases
            where purchases.user_id = auth.uid()
            and purchases.product_id = reviews.product_id
            and purchases.status = 'completed'
        )
    );

create policy "Users can update their own reviews"
    on public.reviews for update
    using (auth.uid() = user_id);

create policy "Users can delete their own reviews"
    on public.reviews for delete
    using (auth.uid() = user_id);

-- Subscriptions policies
create policy "Users can view their own subscriptions"
    on public.subscriptions for select
    using (auth.uid() = user_id);

create policy "Service role can manage subscriptions"
    on public.subscriptions for all
    using ( auth.jwt() ->> 'role' = 'service_role' )
    with check ( auth.jwt() ->> 'role' = 'service_role' );

-- Credits policies
create policy "Users can view their own credits"
    on public.credits for select
    using (auth.uid() = user_id);

create policy "Service role can manage credits"
    on public.credits for all
    using ( auth.jwt() ->> 'role' = 'service_role' )
    with check ( auth.jwt() ->> 'role' = 'service_role' );

-- Add policy for service role to insert purchases
create policy "Service role can insert purchases"
    on public.purchases for insert
    with check ( auth.jwt() ->> 'role' = 'service_role' );

-- Create function to handle updated_at
drop function if exists handle_updated_at() cascade;

create or replace function handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Drop existing triggers
drop trigger if exists handle_profiles_updated_at on public.profiles;
drop trigger if exists handle_products_updated_at on public.products;
drop trigger if exists handle_purchases_updated_at on public.purchases;
drop trigger if exists handle_reviews_updated_at on public.reviews;
drop trigger if exists handle_subscriptions_updated_at on public.subscriptions;
drop trigger if exists handle_credits_updated_at on public.credits;

-- Create triggers for updated_at
create trigger handle_profiles_updated_at
    before update on public.profiles
    for each row execute function handle_updated_at();

create trigger handle_products_updated_at
    before update on public.products
    for each row execute function handle_updated_at();

create trigger handle_purchases_updated_at
    before update on public.purchases
    for each row execute function handle_updated_at();

create trigger handle_reviews_updated_at
    before update on public.reviews
    for each row execute function handle_updated_at();

create trigger handle_subscriptions_updated_at
    before update on public.subscriptions
    for each row execute function handle_updated_at();

create trigger handle_credits_updated_at
    before update on public.credits
    for each row execute function handle_updated_at();

-- Set up Row Level Security (RLS)
alter table public.profiles force row level security; 