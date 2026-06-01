-- After-school garden programme with the 1–4 scale and 5 areas.
insert into programme (id, name, scale_max, scale_descriptors) values
  ('11111111-1111-1111-1111-111111111111', 'After-school Garden', 4,
   '[{"value":1,"label":"Emerging","description":"rarely or not yet observed"},
     {"value":2,"label":"Developing","description":"beginning to show, inconsistent"},
     {"value":3,"label":"Consistent","description":"reliably shows this most of the time"},
     {"value":4,"label":"Strong","description":"consistently and independently demonstrates this"}]');

insert into development_area (id, programme_id, name, sort_order, garden_only) values
  ('a1000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','General',1,false),
  ('a1000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Emotional Development',2,false),
  ('a1000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Artistic / Creative Development',3,false),
  ('a1000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Social & Interaction Skills',4,false),
  ('a1000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','Garden & Connection to Nature',5,true);

insert into indicator (area_id, text, sort_order) values
  ('a1000000-0000-0000-0000-000000000001','Good general appearance',1),
  ('a1000000-0000-0000-0000-000000000001','Willingness to clean up after class',2),
  ('a1000000-0000-0000-0000-000000000001','Willingness to listen and ask questions',3),
  ('a1000000-0000-0000-0000-000000000001','Willing to co-operate',4),
  ('a1000000-0000-0000-0000-000000000001','Shows effort and engagement in activities',5),
  ('a1000000-0000-0000-0000-000000000002','Willingness to communicate with the facilitator',1),
  ('a1000000-0000-0000-0000-000000000002','Ability to demonstrate a strong sense of self',2),
  ('a1000000-0000-0000-0000-000000000002','Ability to show empathy when appropriate',3),
  ('a1000000-0000-0000-0000-000000000002','Willingness to express feelings and emotions verbally',4),
  ('a1000000-0000-0000-0000-000000000003','Ability to identify materials / tools',1),
  ('a1000000-0000-0000-0000-000000000003','Ability to hold and use materials / tools',2),
  ('a1000000-0000-0000-0000-000000000003','Willingness to show and share work with other children',3),
  ('a1000000-0000-0000-0000-000000000003','Willingness to experiment with materials',4),
  ('a1000000-0000-0000-0000-000000000003','Ability to complete projects as instructed',5),
  ('a1000000-0000-0000-0000-000000000004','Concentrates, listens and follows instructions',1),
  ('a1000000-0000-0000-0000-000000000004','Shows appreciation for other children',2),
  ('a1000000-0000-0000-0000-000000000004','Shows respect to the facilitator',3),
  ('a1000000-0000-0000-0000-000000000004','Demonstrates good problem-solving in class',4),
  ('a1000000-0000-0000-0000-000000000004','Freely shares tools and materials with others',5),
  ('a1000000-0000-0000-0000-000000000005','Self-regulates when required',1),
  ('a1000000-0000-0000-0000-000000000005','Interacts with the garden outside facilitated sessions',2),
  ('a1000000-0000-0000-0000-000000000005','Shows care for the environment/animals/insects',3),
  ('a1000000-0000-0000-0000-000000000005','Shows interest/fascination with the outdoors',4),
  ('a1000000-0000-0000-0000-000000000005','Uses the space independently during breakaways',5);

insert into class_group (id, programme_id, name, has_garden_component) values
  ('c1000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Class 1', true);
