ALTER TABLE
    "Pictures"
ALTER
    COLUMN "fileName" SET NOT NULL;

ALTER TABLE 
    "Pictures"
DROP
    COLUMN "data";

ALTER TABLE
    "Pictures"
DROP
    COLUMN "thumbnail";