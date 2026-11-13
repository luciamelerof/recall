<?php
require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

function formatQuestion(array $row): array
{
    return [
        'id' => (string) $row['id'],
        'topic' => $row['topic'],
        'text' => $row['text'],
        'answer' => $row['answer'],
        'createdAt' => $row['created_at'],
    ];
}

function validateQuestion(array $body): array
{
    $errors = [];
    $limits = ['topic' => 100, 'text' => 500, 'answer' => 255];

    foreach ($limits as $field => $max) {
        $value = trim($body[$field] ?? '');
        if ($value === '') {
            $errors[] = "$field is required";
        } elseif (mb_strlen($value) > $max) {
            $errors[] = "$field must be $max characters or fewer";
        }
    }
    return $errors;
}

try {
    $pdo = getConnection();

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $rows = $pdo
                ->query('SELECT id, topic, text, answer, created_at FROM questions ORDER BY id')
                ->fetchAll();
            jsonResponse(array_map('formatQuestion', $rows));

        case 'POST':
            $body = readJsonBody();
            $errors = validateQuestion($body);
            if ($errors) {
                jsonResponse(['errors' => $errors], 422);
            }

            $stmt = $pdo->prepare(
                'INSERT INTO questions (topic, text, answer) VALUES (:topic, :text, :answer)'
            );
            $stmt->execute([
                'topic' => trim($body['topic']),
                'text' => trim($body['text']),
                'answer' => trim($body['answer']),
            ]);

            $stmt = $pdo->prepare(
                'SELECT id, topic, text, answer, created_at FROM questions WHERE id = :id'
            );
            $stmt->execute(['id' => $pdo->lastInsertId()]);
            jsonResponse(formatQuestion($stmt->fetch()), 201);

        case 'DELETE':
            $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
            if (!$id) {
                jsonResponse(['error' => 'A valid id is required'], 400);
            }

            $stmt = $pdo->prepare('DELETE FROM questions WHERE id = :id');
            $stmt->execute(['id' => $id]);

            if ($stmt->rowCount() === 0) {
                jsonResponse(['error' => 'Question not found'], 404);
            }
            http_response_code(204);
            exit;

        default:
            header('Allow: GET, POST, DELETE');
            jsonResponse(['error' => 'Method not allowed'], 405);
    }
} catch (PDOException $e) {
    jsonResponse(['error' => 'Database error'], 500);
}
