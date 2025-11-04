<?php
// rossko_bridge.php — простой прокси к ROSSKO API

header('Content-Type: application/json; charset=utf-8');

function fail($msg, $extra = []) {
    http_response_code(200);
    echo json_encode(array_merge(['ok' => false, 'error' => $msg], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

// 1) Параметры
$q           = isset($_GET['q']) ? (string)$_GET['q'] : '';
$delivery_id = isset($_GET['delivery_id']) ? (string)$_GET['delivery_id'] : '';
$address_id  = isset($_GET['address_id']) ? (string)$_GET['address_id'] : '';

if ($q === '') {
    fail('Missing required param: q');
}

// 2) Ключ берем из файла /www/api.autoc.pro/.secrets/rossko_key.php
//    Содержимое файла:  <?php return 'ВАШ_КЛЮЧ';
$key_file = __DIR__ . '/.secrets/rossko_key.php';
if (!is_file($key_file)) {
    fail('Key file not found', ['hint' => false]);
}
$API_KEY = include $key_file;
if (!$API_KEY) {
    fail('Empty API key');
}

// 3) Целевой endpoint ROSSKO
$ROSSKO_URLS = [
    'https://b2b.rossko.ru/service/v2.1/search/byname',
    'https://api.rossko.ru/service/v2.1/search/byname',
    'https://b2bapi.rossko.ru/service/v2.1/search/byname'
];

// 4) Общие заголовки
$headers = [
    'Accept: application/json',
    'X-Api-Key: ' . $API_KEY,
    'User-Agent: AutocPro/1.0'
];

// 5) Параметры запроса
$qparams = http_build_query([
    'q'           => $q,
    'delivery_id' => $delivery_id,
    'address_id'  => $address_id,
], '', '&', PHP_QUERY_RFC3986);

// 6) Пробуем поочередно несколько хостов
$diag = [];
foreach ($ROSSKO_URLS as $base) {
    $url = $base . '?' . $qparams;

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 3,
    ]);

    $body = curl_exec($ch);
    $errno = curl_errno($ch);
    $err   = curl_error($ch);
    $code  = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $ctype = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    // Если пришел JSON — сразу отдаем
    if ($errno === 0 && $code >= 200 && $code < 300 && stripos($ctype, 'json') !== false) {
        http_response_code(200);
        echo $body;
        exit;
    }

    // Сохраняем диагностику
    $snip = '';
    if (is_string($body)) {
        $snip = mb_substr(preg_replace('~\s+~u', ' ', $body), 0, 300);
    }
    $diag[] = [
        'url'   => $url,
        'http'  => $code,
        'errno' => $errno,
        'err'   => $err,
        'ctype' => $ctype,
        'snip'  => $snip,
    ];
}

// 7) Если все попытки не дали валидный JSON
fail('Upstream returned non-JSON', ['diag' => $diag]);
