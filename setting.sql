DROP TABLE IF EXISTS articles_users;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS articles;

CREATE TABLE users (
  id int NOT NULL AUTO_INCREMENT,
  username varchar(255) NOT NULL,
  password varchar(255) NOT NULL,
  school varchar(255) NOT NULL,
  coin int DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE TABLE articles (
  id int NOT NULL AUTO_INCREMENT,
  title varchar(100) NOT NULL,
  content text,
  author varchar(50) DEFAULT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  image_path varchar(255) DEFAULT NULL,
  selection int NOT NULL DEFAULT 0,
  like_cnt int NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE TABLE comments (
  id int NOT NULL AUTO_INCREMENT,
  content varchar(255) DEFAULT NULL,
  users_id int DEFAULT NULL,
  articles_id int DEFAULT NULL,
  PRIMARY KEY (id),
  KEY users_id (users_id),
  KEY articles_id (articles_id),
  CONSTRAINT comments_ibfk_1 FOREIGN KEY (users_id) REFERENCES users (id),
  CONSTRAINT comments_ibfk_2 FOREIGN KEY (articles_id) REFERENCES articles (id)
);

CREATE TABLE articles_users (
  articles_id int not null,
  users_id int NOT NULL,
  FOREIGN KEY (articles_id) REFERENCES articles (id),
  FOREIGN KEY (users_id) REFERENCES users (id),
  PRIMARY KEY (articles_id, users_id)
);