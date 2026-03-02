-- FCM push notification tokens
create table if not exists fcm_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(token)
);

create index if not exists idx_fcm_tokens_user_id on fcm_tokens(user_id);

-- RLS
alter table fcm_tokens enable row level security;

-- Users can insert/update their own tokens
create policy "Users can manage own FCM tokens"
  on fcm_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role can read all tokens (for push sending)
create policy "Service role can read all FCM tokens"
  on fcm_tokens for select
  using (true);
