ALTER TABLE
    "Pictures"
ADD
    COLUMN "fileName" character varying(40);

ALTER TABLE 
    "Pictures"
ALTER
    COLUMN "data" DROP NOT NULL;

ALTER TABLE
    "Pictures"
ALTER
    COLUMN "thumbnail" DROP NOT NULL;