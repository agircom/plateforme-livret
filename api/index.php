<?php

header("Content-Type: application/json");
define('__SALT__', '!P10p&42!');

require_once 'common.inc.php';

require_once 'RedBeanPHP' . DIRECTORY_SEPARATOR . 'rb.php';
R::setup('mysql:host=localhost;dbname=feader', 'root', '');

require_once 'Slim' . DIRECTORY_SEPARATOR . 'Slim.php';
\Slim\Slim::registerAutoloader();


$app = new \Slim\Slim();

// REST Api routes
$app->post('/account/create', function() use($app) {
    $data = json_decode($app->request->getBody());
    $user = $data->user;
    $passwd = $data->passwd;
    $timestamp = $data->timestamp;
    if (!isset($user) || !isset($passwd) || !isset($timestamp)) {
        $app->response()->status(400);
    } else {
        $userExists = R::findOne('user', 'username=?', array($user));
        if (!is_null($userExists)) {
            $app->response()->status(423);
        } else {
            $bean = R::dispense('user');
            $bean->username = $user;
            $bean->passwd = $passwd;
            $bean->date_create = new DateTime();
            $id = R::store($bean);
            if (!is_int($id)) {
                $app->response()->status(202);
            } else {
                $app->response()->status(201);
            }
        }
    }
});


$app->get('/token', function() use ($app) {
    $user = $app->request->params('user');
    $passwd = $app->request->params('passwd');
    $timestamp = $app->request->params('timestamp');
    if (!isset($user) || !isset($passwd) || !isset($timestamp)) {
        $app->response()->status(400);
    } else {
        $user = R::findOne('user', 'username=?', array($user));
        if (is_null($user)) {
            $app->response()->status(403);
        } else {
            $data['user'] = $user;
            $data = array('token' => 42);
            echo json_encode($data);
        }
    }
});

// run REST Api
$app->run();
R::close();
