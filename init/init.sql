-- ENUMS
CREATE TYPE "enum_UserRoles_roleName" AS ENUM ('ADMIN', 'CREATOR');

-- TABLES
CREATE TABLE "Categories" (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE "Ingredients" (
    id integer NOT NULL,
    name character varying(80) NOT NULL,
    "sortNumber" integer NOT NULL,
    value double precision,
    "unitId" integer NOT NULL,
    "recipeSectionId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE "Pictures" (
    id integer NOT NULL,
    "sortNumber" integer NOT NULL,
    name character varying(80) NOT NULL,
    data bytea NOT NULL,
    thumbnail bytea NOT NULL,
    "recipeId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE "RecipeRecipes" (
    "recipeId" integer NOT NULL,
    "associatedRecipeId" integer NOT NULL
);

CREATE TABLE "RecipeSections" (
    id integer NOT NULL,
    name character varying(80),
    "sortNumber" integer NOT NULL,
    method text,
    "recipeId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE "RecipeTags" (
    "recipeId" integer NOT NULL,
    "tagId" integer NOT NULL
);

CREATE TABLE "Recipes" (
    id integer NOT NULL,
    name character varying(80) NOT NULL,
    "nameSearch" character varying(80),
    description character varying(160),
    "descriptionSearch" character varying(160),
    serves integer,
    method text,
    sources character varying(1000) [] NOT NULL,
    "categoryId" integer NOT NULL,
    "creatorId" integer NOT NULL,
    "modifierId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE "Tags" (
    id integer NOT NULL,
    name character varying(80) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE "UnitCategories" (
    id integer NOT NULL,
    name character varying(80) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE "Units" (
    id integer NOT NULL,
    name character varying(80) NOT NULL,
    abbreviation character varying(20) NOT NULL,
    required boolean NOT NULL,
    "unitCategoryId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE "UserRoles" (
    id integer NOT NULL,
    "roleName" "enum_UserRoles_roleName" NOT NULL,
    "userId" integer NOT NULL,
    "deletedAt" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE "Users" (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(60) NOT NULL,
    "firstName" character varying(50),
    "lastName" character varying(50),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

-- SEQUENCES
CREATE SEQUENCE "Categories_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE "Categories_id_seq" OWNED BY "Categories".id;

CREATE SEQUENCE "Ingredients_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE "Ingredients_id_seq" OWNED BY "Ingredients".id;

CREATE SEQUENCE "Pictures_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE "Pictures_id_seq" OWNED BY "Pictures".id;

CREATE SEQUENCE "RecipeSections_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE "RecipeSections_id_seq" OWNED BY "RecipeSections".id;

CREATE SEQUENCE "Recipes_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE "Recipes_id_seq" OWNED BY "Recipes".id;

CREATE SEQUENCE "Tags_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE "Tags_id_seq" OWNED BY "Tags".id;

CREATE SEQUENCE "UnitCategories_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE "UnitCategories_id_seq" OWNED BY "UnitCategories".id;

CREATE SEQUENCE "Units_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE "Units_id_seq" OWNED BY "Units".id;

CREATE SEQUENCE "UserRoles_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE "UserRoles_id_seq" OWNED BY "UserRoles".id;

CREATE SEQUENCE "Users_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

ALTER SEQUENCE "Users_id_seq" OWNED BY "Users".id;

-- CONSTRAINTS
ALTER TABLE
    ONLY "Categories"
ALTER COLUMN
    id
SET
    DEFAULT nextval('"Categories_id_seq"' :: regclass);

ALTER TABLE
    ONLY "Ingredients"
ALTER COLUMN
    id
SET
    DEFAULT nextval('"Ingredients_id_seq"' :: regclass);

ALTER TABLE
    ONLY "Pictures"
ALTER COLUMN
    id
SET
    DEFAULT nextval('"Pictures_id_seq"' :: regclass);

ALTER TABLE
    ONLY "RecipeSections"
ALTER COLUMN
    id
SET
    DEFAULT nextval('"RecipeSections_id_seq"' :: regclass);

ALTER TABLE
    ONLY "Recipes"
ALTER COLUMN
    id
SET
    DEFAULT nextval('"Recipes_id_seq"' :: regclass);

ALTER TABLE
    ONLY "Tags"
ALTER COLUMN
    id
SET
    DEFAULT nextval('"Tags_id_seq"' :: regclass);

ALTER TABLE
    ONLY "UnitCategories"
ALTER COLUMN
    id
SET
    DEFAULT nextval('"UnitCategories_id_seq"' :: regclass);

ALTER TABLE
    ONLY "Units"
ALTER COLUMN
    id
SET
    DEFAULT nextval('"Units_id_seq"' :: regclass);

ALTER TABLE
    ONLY "UserRoles"
ALTER COLUMN
    id
SET
    DEFAULT nextval('"UserRoles_id_seq"' :: regclass);

ALTER TABLE
    ONLY "Users"
ALTER COLUMN
    id
SET
    DEFAULT nextval('"Users_id_seq"' :: regclass);

ALTER TABLE
    ONLY "Categories"
ADD
    CONSTRAINT "Categories_name_key" UNIQUE (name);

ALTER TABLE
    ONLY "Categories"
ADD
    CONSTRAINT "Categories_pkey" PRIMARY KEY (id);

ALTER TABLE
    ONLY "Ingredients"
ADD
    CONSTRAINT "Ingredients_pkey" PRIMARY KEY (id);

ALTER TABLE
    ONLY "Pictures"
ADD
    CONSTRAINT "Pictures_pkey" PRIMARY KEY (id);

ALTER TABLE
    ONLY "RecipeRecipes"
ADD
    CONSTRAINT "RecipeRecipes_pkey" PRIMARY KEY ("recipeId", "associatedRecipeId");

ALTER TABLE
    ONLY "RecipeSections"
ADD
    CONSTRAINT "RecipeSections_pkey" PRIMARY KEY (id);

ALTER TABLE
    ONLY "RecipeTags"
ADD
    CONSTRAINT "RecipeTags_pkey" PRIMARY KEY ("recipeId", "tagId");

ALTER TABLE
    ONLY "Recipes"
ADD
    CONSTRAINT "Recipes_name_key" UNIQUE (name);

ALTER TABLE
    ONLY "Recipes"
ADD
    CONSTRAINT "Recipes_pkey" PRIMARY KEY (id);

ALTER TABLE
    ONLY "Tags"
ADD
    CONSTRAINT "Tags_name_key" UNIQUE (name);

ALTER TABLE
    ONLY "Tags"
ADD
    CONSTRAINT "Tags_pkey" PRIMARY KEY (id);

ALTER TABLE
    ONLY "UnitCategories"
ADD
    CONSTRAINT "UnitCategories_name_key" UNIQUE (name);

ALTER TABLE
    ONLY "UnitCategories"
ADD
    CONSTRAINT "UnitCategories_pkey" PRIMARY KEY (id);

ALTER TABLE
    ONLY "Units"
ADD
    CONSTRAINT "Units_abbreviation_key" UNIQUE (abbreviation);

ALTER TABLE
    ONLY "Units"
ADD
    CONSTRAINT "Units_name_key" UNIQUE (name);

ALTER TABLE
    ONLY "Units"
ADD
    CONSTRAINT "Units_pkey" PRIMARY KEY (id);

ALTER TABLE
    ONLY "UserRoles"
ADD
    CONSTRAINT "UserRoles_pkey" PRIMARY KEY (id);

ALTER TABLE
    ONLY "Users"
ADD
    CONSTRAINT "Users_pkey" PRIMARY KEY (id);

ALTER TABLE
    ONLY "Users"
ADD
    CONSTRAINT "Users_username_key" UNIQUE (username);

CREATE UNIQUE INDEX "unique-role" ON "UserRoles" USING btree ("roleName", "userId", "deletedAt");

ALTER TABLE
    ONLY "Ingredients"
ADD
    CONSTRAINT "Ingredients_recipeSectionId_fkey" FOREIGN KEY ("recipeSectionId") REFERENCES "RecipeSections"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY "Ingredients"
ADD
    CONSTRAINT "Pictures_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"(id) ON UPDATE CASCADE ON DELETE
SET
    NULL;

ALTER TABLE
    ONLY "RecipeRecipes"
ADD
    CONSTRAINT "RecipeRecipes_associatedRecipeId_fkey" FOREIGN KEY ("associatedRecipeId") REFERENCES "Recipes"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY "RecipeRecipes"
ADD
    CONSTRAINT "RecipeRecipes_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY "RecipeSections"
ADD
    CONSTRAINT "RecipeSections_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY "RecipeTags"
ADD
    CONSTRAINT "RecipeTags_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY "RecipeTags"
ADD
    CONSTRAINT "RecipeTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tags"(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY "Recipes"
ADD
    CONSTRAINT "Recipes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Categories"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE
    ONLY "Recipes"
ADD
    CONSTRAINT "Recipes_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"(id) ON UPDATE CASCADE;

ALTER TABLE
    ONLY "Recipes"
ADD
    CONSTRAINT "Recipes_modifierId_fkey" FOREIGN KEY ("modifierId") REFERENCES "Users"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE
    ONLY "Units"
ADD
    CONSTRAINT "Units_unitCategoryId_fkey" FOREIGN KEY ("unitCategoryId") REFERENCES "UnitCategories"(id) ON UPDATE CASCADE;

ALTER TABLE
    ONLY "UserRoles"
ADD
    CONSTRAINT "UserRoles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;