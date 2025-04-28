-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users table is handled by Supabase Auth, but we'll create a profiles table
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade,
    name varchar(255) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id)
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

-- Create policies
create policy "Public profiles are viewable by everyone"
    on public.profiles for select
    using (true);

create policy "Users can update own profile"
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

-- Create function to handle updated_at
create or replace function handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

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