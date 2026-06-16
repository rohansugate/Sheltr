-- Sheltr domain tables (listings, applications, showings, messaging)
-- Client state still uses Zustand locally; these tables support future server persistence.

create type public.listing_status as enum ('DRAFT', 'ACTIVE', 'INACTIVE');
create type public.listing_source as enum ('MANUAL', 'IMPORTED', 'SEED');
create type public.application_status as enum (
  'SENT',
  'UNDER_REVIEW',
  'ACCEPTED',
  'DECLINED',
  'LEASE_SIGNED'
);
create type public.showing_status as enum ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED');

create table if not exists public.listings (
  id text primary key,
  landlord_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  monthly_rent integer not null,
  bedrooms integer not null,
  bathrooms numeric(3, 1) not null default 1,
  zip_code text not null,
  neighborhood text,
  is_section8_approved boolean not null default false,
  is_ground_floor boolean not null default false,
  latitude double precision,
  longitude double precision,
  images jsonb not null default '[]'::jsonb,
  source public.listing_source not null default 'MANUAL',
  status public.listing_status not null default 'DRAFT',
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.showings (
  id text primary key,
  listing_id text not null references public.listings (id) on delete cascade,
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  status public.showing_status not null default 'PENDING',
  scheduled_date date not null,
  scheduled_time text not null,
  contact_method text not null,
  contact_value text not null,
  landlord_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id text primary key,
  listing_id text not null references public.listings (id) on delete cascade,
  showing_id text references public.showings (id) on delete set null,
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  status public.application_status not null default 'SENT',
  packet jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id text primary key,
  listing_id text references public.listings (id) on delete set null,
  application_id text references public.applications (id) on delete set null,
  showing_id text references public.showings (id) on delete set null,
  seeker_id uuid not null references public.profiles (id) on delete cascade,
  landlord_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id text primary key,
  conversation_id text not null references public.conversations (id) on delete cascade,
  sender_role text not null check (sender_role in ('SEEKER', 'LANDLORD')),
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists listings_landlord_id_idx on public.listings (landlord_id);
create index if not exists listings_zip_code_idx on public.listings (zip_code);
create index if not exists showings_seeker_id_idx on public.showings (seeker_id);
create index if not exists applications_seeker_id_idx on public.applications (seeker_id);
create index if not exists messages_conversation_id_idx on public.messages (conversation_id);

alter table public.listings enable row level security;
alter table public.showings enable row level security;
alter table public.applications enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Landlords manage their listings
create policy "Landlords manage own listings"
  on public.listings
  for all
  to authenticated
  using (landlord_id = auth.uid())
  with check (landlord_id = auth.uid());

-- Seekers read active listings
create policy "Seekers read active listings"
  on public.listings
  for select
  to authenticated
  using (status = 'ACTIVE');

-- Participants access their showings
create policy "Showing participants"
  on public.showings
  for all
  to authenticated
  using (
    seeker_id = auth.uid()
    or exists (
      select 1 from public.listings l
      where l.id = listing_id and l.landlord_id = auth.uid()
    )
  );

-- Participants access their applications
create policy "Application participants"
  on public.applications
  for all
  to authenticated
  using (
    seeker_id = auth.uid()
    or exists (
      select 1 from public.listings l
      where l.id = listing_id and l.landlord_id = auth.uid()
    )
  );

-- Conversation participants
create policy "Conversation participants"
  on public.conversations
  for select
  to authenticated
  using (seeker_id = auth.uid() or landlord_id = auth.uid());

create policy "Messages for conversation participants"
  on public.messages
  for all
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.seeker_id = auth.uid() or c.landlord_id = auth.uid())
    )
  );
