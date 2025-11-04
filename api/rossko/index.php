<?php
header('Content-Type: application/json; charset=utf-8');

$q = $_GET['q'] ?? '';
$delivery_id = $_GET['delivery_id'] ?? '';
$address_id = $_GET['address_id'] ?? '';

if (!$q || !$delivery_id || !$address_id) {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error' => 'Missing parameters']);
    exit;
}

$API_KEY = getenv('ROSSKO_API_KEY'); // переменная окружения в Vercel
$url = "https://b2b.rossko.ru/service/v2.1/search/byname?q=" . urlencode($q)
     . "&delivery_id=" . urlencode($delivery_id)
     . "&address_id=" . urlencode($address_id);

$headers = [
    "X-Api-Key: $API_KEY",
    "Accept: application/json",
    "User-Agent: rossko-proxy/1.0"
];

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_TIMEOUT => 20,
]);
$response = curl_exec($ch);
$err = curl_error($ch);
$status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

if ($err) {
    http_response_code(502);
    echo json_encode(['ok'=>false,'error' => 'cURL error','msg'=>$err]);
} else {
    http_response_code($status ?: 200);
    echo $response;
}
