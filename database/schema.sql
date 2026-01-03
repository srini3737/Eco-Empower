-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table
create table users (
  id uuid default uuid_generate_v4() primary key,
  username text unique not null,
  email text not null,
  password_hash text not null,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Wallets Table
create table wallets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  balance decimal(10, 2) default 0.00 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Transactions Table
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  type text check (type in ('credit', 'debit')) not null,
  amount decimal(10, 2) not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Feedbacks Table
create table feedbacks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete set null,
  username text,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders Table
create table orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete set null,
  username text,
  items_json jsonb not null,
  total decimal(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
alter table users enable row level security;
alter table wallets enable row level security;
alter table transactions enable row level security;
alter table feedbacks enable row level security;
alter table orders enable row level security;

-- Users Policies
create policy "Public profiles are viewable by everyone"
  on users for select
  using ( true );

create policy "Users can update own profile"
  on users for update
  using ( auth.uid() = id );

-- Wallets Policies
create policy "Users can view own wallet"
  on wallets for select
  using ( auth.uid() = user_id );

create policy "Admins can view all wallets"
  on wallets for select
  using ( 
    exists (
      select 1 from users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

-- Transactions Policies
create policy "Users can view own transactions"
  on transactions for select
  using ( auth.uid() = user_id );

create policy "Admins can view all transactions"
  on transactions for select
  using ( 
    exists (
      select 1 from users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

-- Feedbacks Policies
create policy "Anyone can insert feedback"
  on feedbacks for insert
  with check ( true );

create policy "Admins can view all feedbacks"
  on feedbacks for select
  using ( 
    exists (
      select 1 from users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

-- Orders Policies
create policy "Users can view own orders"
  on orders for select
  using ( auth.uid() = user_id );

create policy "Admins can view all orders"
  on orders for select
  using ( 
    exists (
      select 1 from users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );

create policy "Users can insert own orders"
  on orders for insert
  with check ( auth.uid() = user_id );
