<?php

use Shuchkin\SimpleXLS;
use Shuchkin\SimpleXLSX;
use App\ApiResponse;


require_once  'vendor/autoload.php';

if (!isset($_FILES['file'])) {
    ApiResponse::internal_server_error('No file received');
    exit();
}
$allowed_extensions = array('xls', 'xlsx');

$file = $_FILES['file'];
$file_name = $file['name'];
$file_tmp = $file['tmp_name'];
$file_extension = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));



if (!in_array($file_extension, $allowed_extensions)) {
    $msg = 'Invalid file extension. Allowed extensions are: ' . implode(', ', $allowed_extensions);
    ApiResponse::internal_server_error($msg);
    exit();
}
$required_keys = ['category_name', 'ticket_id', 'ticket_issue_date', 'counter_id', 'operator_name', 'service_time', 'wait_time'];

$excel;

if ($file_extension === 'xls') {
    $excel = SimpleXLS::parseFile($file_tmp);
}
if ($file_extension === 'xlsx') {
    $excel = SimpleXLSX::parseFile("$file_tmp");
}


$rows = $excel->rows();
$retry_limit = count($rows); // Set a retry limit to prevent infinite loop
$retry_count = 0;

// Loop until all required keys are found or retry limit is reached
while ($retry_count < $retry_limit) {
    $headers = array_map(function ($header) {
        return preg_replace('/\s+/', '_', strtolower($header));
    }, $rows[0]);

    // Check if all required keys are present in the headers
    $missing_keys = array_diff($required_keys, $headers);

    if (empty($missing_keys)) {
        // All required keys found, exit loop
        break;
    }

    // Increment retry count and shift rows to check next row
    $retry_count++;
    array_shift($rows);
}


// Retry limit reached, handle error or notify user
if ($retry_count == $retry_limit) {
    $msg = 'Required keys: ' . implode(', ', $required_keys);
    $msg .= ' not found';
    ApiResponse::internal_server_error($msg);
    exit();
}

$data = array_slice($rows, $retry_count, count($rows));

$result = array_map(function ($row) use ($headers) {
    return array_combine($headers, $row);
}, $data);

ApiResponse::ok('Processing successfull', $result);

// if ($excel = SimpleXLS::parseFile($file_tmp)) {
    
// } else {
//     ApiResponse::internal_server_error(SimpleXLS::parseError());
// }
