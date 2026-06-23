-- Contact form submissions (public submit via API, admin read via service role).

create table contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  message     text not null,
  profile_id  text references profiles(id) on delete set null,
  status      text not null default 'new'
              check (status in ('new', 'read', 'resolved')),
  created_at  timestamptz not null default now()
);

create index contact_submissions_created_idx on contact_submissions (created_at desc);
create index contact_submissions_status_idx on contact_submissions (status);

alter table contact_submissions enable row level security;
