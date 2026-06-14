-- Ranking view for "Top by funding": surfaces each company's best funding_total
-- from metric_records as a single column the frontend can order by.
create view company_funding as
select
  c.id,
  c.display_name,
  coalesce(max(m.value) filter (where m.metric = 'funding_total'), 0) as funding_total
from companies c
left join metric_records m on m.company_id = c.id
where c.status = 'live'
group by c.id, c.display_name;
