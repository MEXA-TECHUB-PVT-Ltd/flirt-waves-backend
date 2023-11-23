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
  gender VARCHAR(255),
  relation_type VARCHAR(255),
  cooking_skill VARCHAR(255),
  habit VARCHAR(255),
  exercise VARCHAR(255),
  hobby VARCHAR(255),
  night_life VARCHAR(255),
  smoking_opinion VARCHAR(255),
  kids_opinion VARCHAR(255),
  block_status BOOLEAN DEFAULT false, 
  verified_status BOOLEAN DEFAULT false,
  report_status BOOLEAN DEFAULT false, 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS UserActivity (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(id),
    last_active_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Gender (
  id SERIAL PRIMARY KEY,
  gender VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 
 
CREATE TABLE IF NOT EXISTS Relationship (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
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

CREATE TABLE IF NOT EXISTS Exercise (
  id SERIAL PRIMARY KEY,
  exercise VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Hobbies (
  id SERIAL PRIMARY KEY,
  hobby VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Nightlife (
  id SERIAL PRIMARY KEY,
  night_life VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Kids (
  id SERIAL PRIMARY KEY,
  kids_opinion VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Smoking (
  id SERIAL PRIMARY KEY,
  smoking_opinion VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS UserRelationships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES Users(id),
  relationship_id INTEGER REFERENCES Relationship(id),
  gender_id INTEGER REFERENCES Gender(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ReportUsers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  reason VARCHAR(255), 
  description VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Matches (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER NOT NULL,
  user2_id INTEGER NOT NULL,
  match_value INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS Favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  favorite_user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES Users(id),
  FOREIGN KEY (favorite_user_id) REFERENCES Users(id)
);
