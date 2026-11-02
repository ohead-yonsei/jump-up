-- 폴짝 기수 저장소. Supabase 프로젝트의 SQL Editor에서 한 번 실행해요.
-- 앱 서버만 비밀 키(SUPABASE_SECRET_KEY)로 읽고 써요. 모든 표에 행 수준 보안을 켜고 공개 정책은 두지 않아서,
-- 공개 키(publishable/anon)로는 아무것도 읽을 수 없어요.

create table if not exists cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  org text not null default '' check (char_length(org) <= 40),
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  join_code text not null unique,
  -- 운영자 코드는 SHA-256 값만 남겨요. 잃어버리면 운영자 화면에서 새로 만들어요.
  operator_hash text not null unique,
  created_at timestamptz not null default now()
);

-- 참여자는 실증 참여 코드(가명)로만 구분해요. 이름이나 연락처는 받지 않아요.
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references cohorts(id) on delete cascade,
  code text not null check (char_length(code) between 1 and 16),
  token_hash text not null unique,
  joined_at timestamptz not null default now(),
  last_sync_at timestamptz
);
create index if not exists participants_cohort_id on participants (cohort_id);

-- 기록 한 줄은 기기의 기록(Entry)과 같은 모양이에요. 한 번 받은 기록은 바꾸지 않아요.
create table if not exists entries (
  participant_id uuid not null references participants(id) on delete cascade,
  id text not null,
  at timestamptz not null,
  type text not null,
  data jsonb not null,
  primary key (participant_id, id)
);
create index if not exists entries_participant_at on entries (participant_id, at);

-- 폴짝을 연 날(기기 시간대의 날짜).
create table if not exists visits (
  participant_id uuid not null references participants(id) on delete cascade,
  day date not null,
  primary key (participant_id, day)
);

alter table cohorts enable row level security;
alter table participants enable row level security;
alter table entries enable row level security;
alter table visits enable row level security;
