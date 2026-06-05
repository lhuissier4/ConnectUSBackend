-- Seed: 2 teachers, 2 alumni, 2 students
-- Les password_hash ci-dessous sont des hashs bcrypt (cost=12) de 'password'
-- À remplacer par de vrais hashs générés via NestJS (@nestjs/bcrypt) en production
INSERT INTO user_accounts (first_name, last_name, email, password_hash, phone_number, status, current_course, class)
VALUES
  ('Alice',   'Martin',  'alice.martin@connectus.fr',   '$2b$12$Y3XI15018OxRUsAuPdTcsu7Hyh4xdy327RKUOp51uOzyLd505flh2', '0601010101', 'TEACHER', 'Software Engineering', NULL),
  ('Bob',     'Dupont',  'bob.dupont@connectus.fr',     '$2b$12$Y3XI15018OxRUsAuPdTcsu7Hyh4xdy327RKUOp51uOzyLd505flh2', '0602020202', 'TEACHER', 'Data Science',         NULL),
  ('Clara',   'Leroy',   'clara.leroy@connectus.fr',    '$2b$12$Y3XI15018OxRUsAuPdTcsu7Hyh4xdy327RKUOp51uOzyLd505flh2', '0603030303', 'ALUMNI',  NULL,                   NULL),
  ('David',   'Moreau',  'david.moreau@connectus.fr',   '$2b$12$Y3XI15018OxRUsAuPdTcsu7Hyh4xdy327RKUOp51uOzyLd505flh2', '0604040404', 'ALUMNI',  NULL,                   NULL),
  ('Emma',    'Bernard', 'emma.bernard@connectus.fr',   '$2b$12$Y3XI15018OxRUsAuPdTcsu7Hyh4xdy327RKUOp51uOzyLd505flh2', '0605050505', 'STUDENT', 'Computer Science',     'M1'),
  ('Florian', 'Petit',   'florian.petit@connectus.fr',  '$2b$12$Y3XI15018OxRUsAuPdTcsu7Hyh4xdy327RKUOp51uOzyLd505flh2', '0606060606', 'STUDENT', 'Computer Science',     'I3');

