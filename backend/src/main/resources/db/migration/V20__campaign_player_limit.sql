alter table campaigns
    add column if not exists player_limit integer not null default 5;

update campaigns
set player_limit = 5
where player_limit is null or player_limit < 1;
