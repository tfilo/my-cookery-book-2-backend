ALTER TABLE
    "Users"
ADD
    COLUMN "confirmed" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE
    "Users"
ADD
    COLUMN "notifications" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE
    "Users"
ADD
    COLUMN "uuid" UUID;

ALTER TABLE
    "Users"
ADD
    COLUMN "email" character varying(320);

ALTER TABLE
    ONLY "Users"
ADD
    CONSTRAINT "Users_email_key" UNIQUE (email);

-- FILL ALL USERACCOUNT WITH EMAIL!!!
-- THAN RUN
ALTER TABLE
    "Users"
ALTER COLUMN
    "email"
SET
    NOT NULL;