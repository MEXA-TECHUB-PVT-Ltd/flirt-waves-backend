-- CREATE TABLE IF NOT EXISTS Admin (
--   id BIGSERIAL PRIMARY KEY, 
--   name text,
--   email text,
--   password text,
--   created_at timestamp DEFAULT NOW(),
--   updated_at timestamp DEFAULT NOW()
-- ); 

CREATE TABLE IF NOT EXISTS Users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  password VARCHAR(255), 
  token VARCHAR(255),
  signup_type VARCHAR(255), 
  image VARCHAR(255),
  device_id VARCHAR(255),
  deleted_status BOOLEAN DEFAULT false, 
  looking_for VARCHAR(255),
  height VARCHAR(255),
  exercise VARCHAR(255),
  cooking_skills VARCHAR(255),
  explains_you VARCHAR(255),
  night_life VARCHAR(255),
  opinion_on_smoking VARCHAR(255),
  about_kids VARCHAR(255),
  eating_habits VARCHAR(255),
  country VARCHAR(255),
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Gender (
  id SERIAL PRIMARY KEY,
  gender VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 
 
CREATE TABLE IF NOT EXISTS Relationship (
  id SERIAL PRIMARY KEY,
  relation_type VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Cookingskill (
  id SERIAL PRIMARY KEY,
  cooking_skill VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Habits (
  id SERIAL PRIMARY KEY,
  habit VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 