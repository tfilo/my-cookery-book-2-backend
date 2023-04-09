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
    COLUMN "email" character varying(320) NOT NULL;

ALTER TABLE
    ONLY "Users"
ADD
    CONSTRAINT "Users_email_key" UNIQUE (email);