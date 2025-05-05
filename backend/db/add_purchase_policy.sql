-- Allow service role to insert purchases
create policy "Service role can insert purchases"
    on public.purchases for insert
    with check (true);

-- Allow users to view their own purchases
create policy "Users can view their own purchases"
    on public.purchases for select
    using (auth.uid() = user_id); 