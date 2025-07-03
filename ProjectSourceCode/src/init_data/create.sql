CREATE TABLE `Users` (
  `user_id` SERIAL INT,
  `username` VARCHAR(100),
  `email` VARCHAR(100),
  `password_hash` VARCHAR(128),
  `icon_url` VARCHAR(100),
  `privilege` VARCHAR(100)
);

CREATE TABLE `Posts` (
  `post_id` SERIAL INT,
  `post_title` VARCHAR(100),
  `post_text` VARCHAR(1000),
  `post_date` INT
);

CREATE TABLE `Posts_To_Users` (
  `user_id` INT,
  `post_id` INT,
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`),
  FOREIGN KEY (`post_id`) REFERENCES `Posts`(`post_id`)
);

CREATE TABLE `Images` (
  `image_id` SERIAL INT,
  `image_url` VARCHAR(100)
);

CREATE TABLE `Threads` (
  `thread_id` SERIAL INT,
  `thread_text` VARCHAR(1000),
  `thread_date` INT
);

CREATE TABLE `Posts_To_Threads` (
  `post_id` INT,
  `thread_id` INT,
  FOREIGN KEY (`post_id`) REFERENCES `Posts`(`post_id`),
  FOREIGN KEY (`thread_id`) REFERENCES `Threads`(`thread_id`)
);

CREATE TABLE `Threads_To_Users` (
  `user_id` INT,
  `thread_id` INT,
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `Threads`(`thread_id`)
);

CREATE TABLE `Threads_To_Images` (
  `thread_id` INT,
  `image_id` INT,
  FOREIGN KEY (`thread_id`) REFERENCES `Threads`(`thread_id`),
  FOREIGN KEY (`image_id`) REFERENCES `Images`(`image_id`)
);

CREATE TABLE `Posts_To_Images` (
  `post_id` INT,
  `image_id` INT,
  FOREIGN KEY (`image_id`) REFERENCES `Images`(`image_id`),
  FOREIGN KEY (`post_id`) REFERENCES `Posts`(`post_id`)
);

