<?php

require_once 'RedBeanPHP' . DIRECTORY_SEPARATOR . 'rb.php';
R::setup('mysql:host=localhost;dbname=feader', 'root', '');

require_once 'Slim' . DIRECTORY_SEPARATOR . 'Slim.php';
\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim();
$app->response->headers->set('Content-Type', 'application/json');

require_once 'common.inc.php';

// REST Api get session token
$app->get('/token', function() use ($app) {
    // get params
    $givenUser = $app->request->get('user');
    $givenPasswd = $app->request->get('passwd');
    $givenTimestamp = $app->request->get('timestamp');
    if (!isset($givenUser) || !isset($givenPasswd) || !isset($givenTimestamp)) {
        // bad request params
        $app->response()->status(400);
    } else {
        // check user credentials
        $user_record = R::findOne('user', 'username=? AND passwd=?', array($givenUser, $givenPasswd));
        if (is_null($user_record)) {
            // unknown user
            $app->response()->status(403);
        } else {
            // check last timestamp
            if ($user_record->last_timestamp === $givenTimestamp) {
                // request already executed
                $app->response()->status(406);
            } else {
                // generate token
                $session_token = md5(uniqid(mt_rand(), true));
                // update user infos
                $date = new DateTime();
                $data = array();
                $user_record->session_token = $session_token;
                $user_record->last_timestamp = $givenTimestamp;
                $user_record->date_last_connect = $date;
                $data['user'] = R::store($user_record);
                $data['session_token'] = $session_token;
                echo json_encode($data);
            }
        }
    }
});

// REST Api user get
$app->get('/user', function() use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    $data = $user_record->export();
    // clear fields
    unset($data['passwd']);
    unset($data['session_token']);
    unset($data['last_timestamp']);
    unset($data['date_create']);
    unset($data['date_last_connect']);
    unset($data['id']);
    echo json_encode($data);
});

// REST Api user create
$app->post('/user', function() use($app) {
    // get user infos
    $data = json_decode($app->request->getBody(), true);
    $givenUserInfos = $data['userInfos'];
    if (is_null($givenUserInfos) || !checkUserInfosCreatePattern($givenUserInfos)) {
        // missing params
        $app->response()->status(400);
    } else {
        // check if user already exists
        $userExists = R::findOne('user', 'username=?', array($givenUserInfos['username']));
        if (!is_null($userExists)) {
            // username exists
            $app->response()->status(423);
        } else {
            // create new user
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


// run REST Api
$app->run();
R::close();
