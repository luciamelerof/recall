<?php
require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

try {
    $pdo = getConnection();

    if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
        header('Allow: PATCH');
        jsonResponse(['error' => 'Method not allowed'], 405);
    }

    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
    if (!$id) {
        jsonResponse(['error' => 'A valid id is required'], 400);
    }

    $final = readJsonBody()['final'] ?? null;
    if (!in_array($final, ['correct', 'incorrect'], true)) {
        jsonResponse(['error' => 'final must be "correct" or "incorrect"'], 422);
    }

    $exists = $pdo->prepare('SELECT id FROM attempt_results WHERE id = :id');
    $exists->execute(['id' => $id]);
    if (!$exists->fetch()) {
        jsonResponse(['error' => 'Result not found'], 404);
    }

    $stmt = $pdo->prepare('UPDATE attempt_results SET final_mark = :final WHERE id = :id');
    $stmt->execute(['final' => $final, 'id' => $id]);

    jsonResponse(['id' => (string) $id, 'final' => $final]);
} catch (PDOException $e) {
    jsonResponse(['error' => 'Database error'], 500);
}
