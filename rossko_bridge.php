<?php
/**
 * ROSSKO Bridge (single file)
 * ----------------------------------------
 * Прокси-скрипт, который принимает GET-параметры и
 * пересылает их на ваш Cloudflare Worker, добавляя заголовок X-Api-Key.
 * Возвращает JSON от воркера "как есть".
 *
 * Параметры:
 *   q            — строка поиска (обязательно)
 *   delivery_id  — ID склада/доставки (опц.)
 *   address_id   — ID адреса (опц.)
 *   demo=1       — демо-ответ локально (опц.)
 */

header('Content-Type: application/json; charset=utf-8');

// === НАСТРОЙКИ =============================================================
// URL вашего Cloudflare Worker (БЕЗ /search/byname на конце)
$WORKER_BASE = 'https://red-haze-b57c.saveliev2021.workers.dev';

// Ваш ROSSKO API-ключ (по вашему подтверждению)
const ROSSKO_API_KEY = 'bc7928efd745d4c6bcefaf8d4ca08059';

// Таймауты
$TIMEOUT = 12;
$RETRIES = 2;
// ==========================================================================

// Вспомогательная функция ответа JSON и выход
function respond($payload, $code = 200) {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

// Параметры запроса
$q           = isset($_GET['q']) ? trim($_GET['q']) : '';
$delivery_id = isset($_GET['delivery_id']) ? trim($_GET['delivery_id']) : '';
$address_id  = isset($_GET['address_id'])  ? trim($_GET['address_id'])  : '';
$demo        = isset($_GET['demo']) ? (int)$_GET['demo'] : 0;

if ($demo === 1) {
    respond([
        'ok'   => true,
        'demo' => true,
        'data' => [
            'query'      => ($q !== '' ? $q : 'масло'),
            'deliveryId' => ($delivery_id !== '' ? $delivery_id : '000000002'),
            'addressId'  => ($address_id  !== '' ? $address_id  : '301007'),
            'currency'   => 'RUB',
            'count'      => 2,
            'items'      => [
                [
                    'brand'        => 'TOTAL',
                    'article'      => 'QUARTZ-9000-5W40',
                    'name'         => 'Моторное масло 5W-40 QUARTZ 9000 4л',
                    'price'        => 2890,
                    'quantity'     => 7,
                    'deliveryDays' => 1,
                    'deliveryId'   => ($delivery_id !== '' ? $delivery_id : '000000002'),
                    'addressId'    => ($address_id  !== '' ? $address_id  : '301007'),
                ],
                [
                    'brand'        => 'LIQUI MOLY',
                    'article'      => 'TOP-TEC-4200-5W30',
                    'name'         => 'Моторное масло 5W-30 Top Tec 4200 5л',
                    'price'        => 5150,
                    'quantity'     => 3,
                    'deliveryDays' => 1,
                    'deliveryId'   => ($delivery_id !== '' ? $delivery_id : '000000002'),
                    'addressId'    => ($address_id  !== '' ? $address_id  : '301007'),
                ]
            ]
        ],
        '__note' => 'DEMO MODE (запрошено &demo=1)'
    ]);
}

if ($q === '') {
    respond(['ok' => false, 'error' => 'Param q is required'], 400);
}

if (!defined('ROSSKO_API_KEY') || ROSSKO_API_KEY === '') {
    respond([
        'ok'    => false,
        'error' => 'API key not set',
        'hint'  => 'Впишите ключ в константу ROSSKO_API_KEY в начале файла.'
    ], 500);
}

// Сборка URL воркера
$query = http_build_query([
    'q'           => $q,
    'delivery_id' => $delivery_id,
    'address_id'  => $address_id
]);
$workerUrl = rtrim($WORKER_BASE, '/') . '/search/byname?' . $query;

// cURL с ретраями
$attempt = 0;
$last = null;
while ($attempt <= $RETRIES) {
    $attempt++;
    $ch = curl_init($workerUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => $TIMEOUT,
        CURLOPT_TIMEOUT        => $TIMEOUT,
        CURLOPT_HTTPHEADER     => [
            'Accept: application/json',
            'Content-Type: application/json; charset=utf-8',
            'X-Api-Key: ' . ROSSKO_API_KEY,
        ],
        CURLOPT_IPRESOLVE      => CURL_IPRESOLVE_V4,
        CURLOPT_USERAGENT      => 'rossko-bridge-php/1.0',
    ]);
    $body = curl_exec($ch);
    $errn = curl_errno($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);

    // Успешный ответ (вернём как есть, даже 4xx)
    if ($errn === 0 && isset($info['http_code']) && $info['http_code'] >= 200 && $info['http_code'] < 500) {
        http_response_code($info['http_code']);
        echo $body;
        exit;
    }

    $last = [
        'errno' => $errn,
        'http'  => $info['http_code'] ?? 0,
        'info'  => $info,
        'body'  => $body,
    ];

    if ($errn !== 0 || ($info['http_code'] >= 500 && $info['http_code'] <= 599)) {
        usleep(250000 * $attempt); // backoff
        continue;
    }
    break;
}

respond([
    'ok'   => false,
    'error'=> 'Upstream error',
    'hint' => 'Сетевая/временная ошибка у ROSSKO (или их защита блокирует egress-IP). Попробуйте повторить запрос позже.',
    'diagnostic' => [
        'url'  => $workerUrl,
        'last' => $last,
    ],
], 502);
