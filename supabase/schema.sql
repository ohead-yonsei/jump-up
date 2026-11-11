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
  last_sync_at timestamptz,
  -- 한 기수 안에서 참여 코드가 겹치면 운영자 표와 CSV에서 두 사람이 섞여 보여요.
  unique (cohort_id, code)
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

-- 연잎 한 장(0.25.0): 기수 사람들과 나누기로 고른 사진 한 장. 사진 파일은 아래 비공개 버킷에 두고, 여기에는 목록만 남겨요.
-- 누가 띄웠는지는 운영자 화면에서만 참여 코드로 보이고, 같은 기수 사람들에게는 사진과 날짜만 보여요.
create table if not exists pads (
  id uuid primary key,
  cohort_id uuid not null references cohorts(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- 운영자가 내린 연잎. 띄운 사람에게만 보여요.
  hidden boolean not null default false
);
create index if not exists pads_cohort_created on pads (cohort_id, created_at desc);
create index if not exists pads_participant on pads (participant_id);

-- 연못 마을(0.28.0): 연잎에 사진 대신 한 줄 글도 띄울 수 있어요. 글 연잎은 사진 파일이 없어요.
alter table pads add column if not exists kind text not null default 'photo';
alter table pads add column if not exists text text not null default '';

-- 연못 마을에 들른 개구리. 본인이 보여주기로 고른 모습(card: 개구리 이름·색·자란 정도·옷)과 마지막으로 들른 날만 남겨요.
-- card가 비어 있으면 모습을 보이지 않고 구경만 한 거예요. 같은 기수 사람들에게는 '오늘 다녀간 개구리'만 보여요.
create table if not exists frogs (
  participant_id uuid primary key references participants(id) on delete cascade,
  cohort_id uuid not null references cohorts(id) on delete cascade,
  card jsonb,
  seen_on date not null,
  -- 운영자가 마을에서 내려둔 개구리. 본인에게만 보여요.
  hidden boolean not null default false
);
create index if not exists frogs_cohort on frogs (cohort_id);

-- 응원: 정해진 문구 가운데 하나. 같은 개구리나 연잎에는 하루에 한 번만 남아요.
-- 받은 사람만 볼 수 있고, 누가 보냈는지는 받은 사람에게도 보여주지 않아요.
create table if not exists cheers (
  from_id uuid not null references participants(id) on delete cascade,
  to_id uuid not null references participants(id) on delete cascade,
  cohort_id uuid not null references cohorts(id) on delete cascade,
  target text not null,
  pad_id uuid references pads(id) on delete cascade,
  kind text not null,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (from_id, target, day)
);
create index if not exists cheers_to on cheers (to_id, created_at desc);

alter table cohorts enable row level security;
alter table participants enable row level security;
alter table entries enable row level security;
alter table visits enable row level security;
alter table pads enable row level security;
alter table frogs enable row level security;
alter table cheers enable row level security;

-- 연잎 사진을 담는 비공개 버킷. 공개 주소가 없고 정책도 두지 않아서, 앱 서버만 비밀 키로 읽고 써요.
-- 사진은 기기에서 800px 정사각형 JPEG로 다시 그려 위치 같은 사진 정보를 빼고, 서버에서 한 번 더 걸러 올려요.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lily-pads', 'lily-pads', false, 1000000, array['image/jpeg'])
on conflict (id) do nothing;
