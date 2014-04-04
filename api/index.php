<?php

require_once 'RedBeanPHP' . DIRECTORY_SEPARATOR . 'rb.php';
R::setup('mysql:host=localhost;dbname=feader', 'root', '');

require_once 'Slim' . DIRECTORY_SEPARATOR . 'Slim.php';
\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim();
$app->response->headers->set('Content-Type', 'application/json');

require_once 'common.inc.php';

// REST Api account create
$app->post('/account/create', function() use($app) {
    $data = json_decode($app->request->getBody(), true);
    $givenUserInfos = $data['userInfos'];
    if (is_null($givenUserInfos) || !checkUserInfosCreatePattern($givenUserInfos)) {
        $app->response()->status(400);
    } else {
        $userExists = R::findOne('user', 'username=?', array($givenUserInfos['username']));
        if (!is_null($userExists)) {
            $app->response()->status(423);
        } else {
            $user_record = R::dispense('user');
            $user_record->username = $givenUserInfos['username'];
            $user_record->passwd = $givenUserInfos['passwd'];
            $user_record->firstName = $givenUserInfos['firstName'];
            $user_record->lastName = $givenUserInfos['lastName'];
            $user_record->date_create = new DateTime();
            $user_record->date_last_connect = null;
            $user_record->session_token = null;
            $user_record->last_timestamp = null;
            $id = R::store($user_record);
            if (!is_int($id)) {
                $app->response()->status(202);
            } else {
                $app->response()->status(201);
            }
        }
    }
});

// REST Api get session token
$app->get('/token', function() use ($app) {
    // get params
    $user = $app->request->get('user');
    $passwd = $app->request->get('passwd');
    $timestamp = $app->request->get('timestamp');
    if (!isset($user) || !isset($passwd) || !isset($timestamp)) {
        // bad request params
        $app->response()->status(400);
    } else {
        // check user credentials
        $user_record = R::findOne('user', 'username=? AND passwd=? AND last_timestamp!=?', array($user, $passwd, $timestamp));
        if (is_null($user_record)) {
            $app->response()->status(403);
        } else {
            $data['user'] = $user_record;
            $data = array('token' => 42);
            echo json_encode($data);
        }
    }
});

// run REST Api
$app->run();
R::close();
