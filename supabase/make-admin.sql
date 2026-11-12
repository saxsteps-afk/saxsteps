-- Make the owner account an admin of SaxSteps.
-- Run after schema.sql, once the owner has signed in on the website at least once.

insert into public.admin_users (user_id)
select id from auth.users where lower(email) = 'saxsteps@gmail.com'
on conflict do nothing;

-- Must return one row. If it returns nothing, sign in on the website first.
select u.email, a.created_at
from public.admin_users a
join auth.users u on u.id = a.user_id;
