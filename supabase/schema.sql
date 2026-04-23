create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  phone text unique not null,
  plan text not null default 'free',
  plan_expires_at timestamptz,
  created_at timestamptz default now()
);

create table public.chit_groups (
  id uuid primary key default gen_random_uuid(),
  organiser_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  member_count int not null,
  monthly_amount numeric(12,2) not null,
  duration_months int not null,
  commission_pct numeric(4,2) not null default 5.0,
  chit_type text not null default 'auction' check (chit_type in ('auction', 'fixed_rotation', 'lucky_draw')),
  start_date date not null,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  chit_group_id uuid references public.chit_groups(id) on delete cascade not null,
  name text not null,
  phone text not null,
  whatsapp_phone text,
  invite_token text unique not null default gen_random_uuid()::text,
  pot_taken boolean not null default false,
  pot_month int,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table public.payment_cycles (
  id uuid primary key default gen_random_uuid(),
  chit_group_id uuid references public.chit_groups(id) on delete cascade not null,
  cycle_number int not null,
  due_date date not null,
  auction_winner_id uuid references public.members(id),
  discount_amount numeric(12,2),
  dividend_per_member numeric(12,2),
  foreman_commission numeric(12,2),
  status text not null default 'pending',
  created_at timestamptz default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid references public.payment_cycles(id) on delete cascade not null,
  member_id uuid references public.members(id) on delete cascade not null,
  amount_due numeric(12,2) not null,
  amount_paid numeric(12,2) not null default 0,
  payment_mode text,
  payment_date date,
  status text not null default 'unpaid',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.auctions (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid references public.payment_cycles(id) on delete cascade unique not null,
  bids jsonb not null default '[]',
  winner_id uuid references public.members(id) not null,
  winning_discount numeric(12,2) not null,
  winner_payout numeric(12,2) not null,
  foreman_commission numeric(12,2) not null,
  dividend_distributed numeric(12,2) not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.chit_groups enable row level security;
alter table public.members enable row level security;
alter table public.payment_cycles enable row level security;
alter table public.payments enable row level security;
alter table public.auctions enable row level security;

create policy "Users manage own profile"
  on public.profiles for all
  using (auth.uid() = id);

create policy "Organisers manage own chit groups"
  on public.chit_groups for all
  using (auth.uid() = organiser_id);

create policy "Organisers manage members of own chits"
  on public.members for all
  using (
    exists (
      select 1 from public.chit_groups
      where id = members.chit_group_id
      and organiser_id = auth.uid()
    )
  );

create policy "Public member read via invite token"
  on public.members for select
  using (true);

create policy "Organisers manage payment cycles"
  on public.payment_cycles for all
  using (
    exists (
      select 1 from public.chit_groups
      where id = payment_cycles.chit_group_id
      and organiser_id = auth.uid()
    )
  );

create policy "Organisers manage payments"
  on public.payments for all
  using (
    exists (
      select 1 from public.payment_cycles pc
      join public.chit_groups cg on cg.id = pc.chit_group_id
      where pc.id = payments.cycle_id
      and cg.organiser_id = auth.uid()
    )
  );

create policy "Organisers manage auctions"
  on public.auctions for all
  using (
    exists (
      select 1 from public.payment_cycles pc
      join public.chit_groups cg on cg.id = pc.chit_group_id
      where pc.id = auctions.cycle_id
      and cg.organiser_id = auth.uid()
    )
  );
