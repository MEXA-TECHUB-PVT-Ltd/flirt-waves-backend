CREATE TABLE IF NOT EXISTS Admin (
  id SERIAL PRIMARY KEY, 
  name text,
  email text,
  password text,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  password VARCHAR(255), 
  token VARCHAR(255),
  signup_type VARCHAR(255), 
  images JSONB,
  device_id VARCHAR(255),
  deleted_status BOOLEAN DEFAULT false,  
  block_status BOOLEAN DEFAULT false, 
  height VARCHAR(255),
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  dob VARCHAR(255),
  gender VARCHAR(255),
  interested_in VARCHAR(255),
  relation_type VARCHAR(255),
  cooking_skill VARCHAR(255),
  habit VARCHAR(255),
  exercise VARCHAR(255),
  hobby VARCHAR(255), 
  smoking_opinion VARCHAR(255),
  kids_opinion VARCHAR(255),
  night_life VARCHAR(255),
  -- interested_in VARCHAR(255), 
  verified_status BOOLEAN DEFAULT false,
  report_status BOOLEAN DEFAULT false, 
  subscription_status BOOLEAN DEFAULT false, 
  online_status BOOLEAN DEFAULT false, 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW(),
  deleted_at timestamp DEFAULT NULL,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 

CREATE TABLE IF NOT EXISTS userscrushes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  crush_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (crush_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_crush_pair UNIQUE (user_id, crush_id)
);

-- ALTER TABLE userscrushes
-- ADD CONSTRAINT unique_user_crush_pair UNIQUE (user_id, crush_id)

CREATE TABLE IF NOT EXISTS UserActivity (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(id),
    last_active_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Gender (
  id SERIAL PRIMARY KEY,
  image VARCHAR(255), 
  gender VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 
 
CREATE TABLE IF NOT EXISTS Relationship (
  id SERIAL PRIMARY KEY,
  image VARCHAR(255), 
  relation_type VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);  

CREATE TABLE IF NOT EXISTS Cookingskill (
  id SERIAL PRIMARY KEY,
  image VARCHAR(255), 
  cooking_skill VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Habits (
  id SERIAL PRIMARY KEY,
  image VARCHAR(255), 
  habit VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Exercise (
  id SERIAL PRIMARY KEY,
  image VARCHAR(255), 
  exercise VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Hobbies (
  id SERIAL PRIMARY KEY,
  image VARCHAR(255), 
  hobby VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Nightlife (
  id SERIAL PRIMARY KEY,
  image VARCHAR(255), 
  night_life VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Kids (
  id SERIAL PRIMARY KEY,
  image VARCHAR(255), 
  kids_opinion VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Smoking (
  id SERIAL PRIMARY KEY,
  image VARCHAR(255), 
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
  user_id INTEGER NOT NULL REFERENCES Users(id), 
  reason VARCHAR(255), 
  description VARCHAR(255), 
  reporter_id INTEGER REFERENCES Users(id),
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

CREATE TABLE IF NOT EXISTS Faqs (
  id SERIAL PRIMARY KEY,
  question VARCHAR(255), 
  answer VARCHAR(255), 
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS Feedback (
 id SERIAL PRIMARY KEY,
 user_id INTEGER REFERENCES Users(id),
 feedback_description VARCHAR(255),
 created_at TIMESTAMP DEFAULT NOW(),
 updated_at TIMESTAMP DEFAULT NOW()
); 

CREATE TABLE IF NOT EXISTS calls (
  call_id SERIAL PRIMARY KEY,
  caller_id INT REFERENCES users(id),
  receiver_id INT REFERENCES users(id),
  channel_name VARCHAR(255) UNIQUE,
  call_type VARCHAR(20) CHECK (call_type IN ('AUDIO', 'VIDEO')) ,
  call_duration TIME,
  call_status VARCHAR(20) CHECK (call_status IN ('ACCEPT', 'DECLINED', 'NOTANSWERED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);