CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic VARCHAR(100) NOT NULL,
    text VARCHAR(500) NOT NULL,
    answer VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attempt_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NULL,
    question_text VARCHAR(500) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    expected VARCHAR(255) NOT NULL,
    given VARCHAR(255) NOT NULL,
    auto_mark ENUM(
        'correct',
        'close',
        'incorrect'
    ) NOT NULL,
    final_mark ENUM('correct', 'incorrect') NULL,
    FOREIGN KEY (attempt_id) REFERENCES attempts (id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE SET NULL
);