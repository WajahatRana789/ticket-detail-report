<?php

namespace App;


class ApiResponse
{
    public static function send_response($data, $httpStatus, $message = null)
    {
        ob_start();
        $response = ['success' => $httpStatus < 400, 'message' => $message, 'data' => $data];
        echo json_encode($response);
        $size = ob_get_length();
        http_response_code($httpStatus);
        header('Content-Type: application/json; charset=utf-8');
        header("Content-Length: {$size}");
        ob_end_flush();
        @ob_flush();
        flush();
        if (session_id()) session_write_close();
    }
    public static function bad_request($message)
    {
        self::send_response(null, 400, $message);
        die();
    }
    public static function ok($message, $data)
    {
        self::send_response($data, 200, $message);
    }
    public static function internal_server_error($message)
    {
        self::send_response(null, 500, $message);
    }
}
