create table if not exists user_tool_usage (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    tool_key varchar(40) not null,
    usage_count integer not null default 0,
    last_used_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, tool_key)
);

create index if not exists idx_user_tool_usage_user_id on user_tool_usage(user_id);
create index if not exists idx_user_tool_usage_last_used_at on user_tool_usage(last_used_at desc);
