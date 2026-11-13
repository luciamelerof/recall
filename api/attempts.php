<?php
require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';
require __DIR__ . '/marking.php';

function fetchAttempts(PDO $pdo, ?int $attemptId = null): array
{
    $sql = 'SELECT a.id AS attempt_id, a.created_at,
                   r.id AS result_id, r.question_id, r.question_text, r.topic,
                   r.expected, r.given, r.auto_mark, r.final_mark
            FROM attempts a
            JOIN attempt_results r ON r.attempt_id = a.id';
    $params = [];

    if ($attemptId !== null) {
        $sql .= ' WHERE a.id = :id';
        $params['id'] = $attemptId;
    }
    $sql .= ' ORDER BY a.id, r.id';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Group the flat JOIN rows into attempts with nested results
    $attempts = [];
    foreach ($stmt->fetchAll() as $row) {
        $id = (string) $row['attempt_id'];
        $attempts[$id] ??= ['id' => $id, 'date' => $row['created_at'], 'results' => []];

        $attempts[$id]['results'][] = [
            'id' => (string) $row['result_id'],
            'questionId' => $row['question_id'] === null ? null : (string) $row['question_id'],
            'question' => $row['question_text'],
            'topic' => $row['topic'],
            'expected' => $row['expected'],
            'given' => $row['given'],
            'auto' => $row['auto_mark'],
            'final' => $row['final_mark'],
        ];
    }
    return array_values($attempts);
}

try {
    $pdo = getConnection();

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            jsonResponse(fetchAttempts($pdo));

        case 'POST':
            $answers = readJsonBody()['answers'] ?? [];
            if (!is_array($answers) || count($answers) === 0) {
                jsonResponse(['error' => 'answers must be a non-empty list'], 422);
            }

            $findQuestion = $pdo->prepare('SELECT id, topic, text, answer FROM questions WHERE id = :id');
            $insertResult = $pdo->prepare(
                'INSERT INTO attempt_results
                    (attempt_id, question_id, question_text, topic, expected, given, auto_mark)
                 VALUES (:attempt, :question, :text, :topic, :expected, :given, :auto)'
            );

            $pdo->beginTransaction();
            $pdo->exec('INSERT INTO attempts () VALUES ()');
            $attemptId = (int) $pdo->lastInsertId();

            foreach ($answers as $answer) {
                $findQuestion->execute(['id' => (int) ($answer['questionId'] ?? 0)]);
                $question = $findQuestion->fetch();

                if (!$question) {
                    $pdo->rollBack();
                    jsonResponse(['error' => 'Unknown question'], 422);
                }

                $given = mb_substr(trim((string) ($answer['given'] ?? '')), 0, 255);

                $insertResult->execute([
                    'attempt' => $attemptId,
                    'question' => $question['id'],
                    'text' => $question['text'],
                    'topic' => $question['topic'],
                    'expected' => $question['answer'],
                    'given' => $given,
                    'auto' => autoMark($given, $question['answer']),
                ]);
            }

            $pdo->commit();
            jsonResponse(fetchAttempts($pdo, $attemptId)[0], 201);

        case 'PATCH':
            // Confirm the clear auto-marks; "close" answers stay for the teacher
            $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
            if (!$id) {
                jsonResponse(['error' => 'A valid id is required'], 400);
            }

            $stmt = $pdo->prepare(
                "UPDATE attempt_results
                 SET final_mark = CASE auto_mark WHEN 'correct' THEN 'correct' ELSE 'incorrect' END
                 WHERE attempt_id = :id AND final_mark IS NULL AND auto_mark <> 'close'"
            );
            $stmt->execute(['id' => $id]);

            $attempt = fetchAttempts($pdo, $id);
            if (!$attempt) {
                jsonResponse(['error' => 'Attempt not found'], 404);
            }
            jsonResponse($attempt[0]);

        default:
            header('Allow: GET, POST, PATCH');
            jsonResponse(['error' => 'Method not allowed'], 405);
    }
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(['error' => 'Database error'], 500);
}
