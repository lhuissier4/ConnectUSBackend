CREATE TABLE user_accounts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,

  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt hash (à gérer côté NestJS avec @nestjs/bcrypt)
  phone_number VARCHAR(30),

  photo_url TEXT,

  rgpd_preferences JSONB DEFAULT '{}', -- TODO a voir comment gerer les préférencers RGPD

  status account_status NOT NULL,

  current_course VARCHAR(255),

  class student_class,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT student_class_required
    CHECK (
      status != 'STUDENT'
      OR class IS NOT NULL
    ),

  CONSTRAINT non_student_class_null
    CHECK (
      status = 'STUDENT'
      OR class IS NULL
    )
);