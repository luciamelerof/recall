<?php
require __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    getConnection()->query('SELECT 1');
    echo json_encode(['status' => 'ok', 'database' => 'connected']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database unavailable']);
}
