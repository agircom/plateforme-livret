<?php

require_once 'Slim' . DIRECTORY_SEPARATOR . 'Slim.php';
define('__MAX_DON_DAY__', 2);
\Slim\Slim::registerAutoloader();
$app = new \Slim\Slim();

// REST Api routes
$app->get('/don/counters', 'getCounters');
$app->get('/don/remaining/:fbId', 'getRemaining');
$app->get('/don/last', 'getLastGoodeed');
$app->get('/partner/random', 'getPartnerRandom');
$app->post('/don/make', 'makeGoodeed');
$app->post('/user/:facebookId', 'syncUser');

//
// REST Api methods
function getCounters() {
    $data = array('counters' => null);
    $sql = 'SELECT g.type, COUNT(g.type) AS counter FROM t_goodeed g GROUP BY type';
    try {
        $db = getConnection();
        $stmt = $db->query($sql);
        $result = $stmt->fetchAll(PDO::FETCH_OBJ);
        $data['counters'] = array('riz' => 0, 'vaccin' => 0, 'arbre' => 0);
        foreach ($result as $counter) {
            $data['counters'][$counter->type] = $counter->counter;
        }
        $db = null;
    } catch (PDOException $e) {
        $data = array('error' => array('text' => $e->getMessage()));
    }
    header("Content-Type: application/json");
    echo json_encode($data);
}

function getRemaining($fb_id) {
    $data = array('remaining' => 0);
    if ($fb_id === '-42') {
        $data['remaining'] = 0;
    } else {
        $sql = 'SELECT COUNT(g.user_id) AS remaining FROM t_goodeed g WHERE g.user_id = :user_id AND g.date > :date_start_day';
        $date = $Date = date("Y-m-j");
        try {
            $db = getConnection();
            $user = getUser($fb_id, $db);
            if ($user === false) {
//                throw new PDOException('Error: user doesn\'t exist');
                $data['remaining'] = __MAX_DON_DAY__;
            }
            $stmt = $db->prepare($sql);
            $stmt->bindParam("user_id", $user->id);
            $stmt->bindParam("date_start_day", $date);
            if ($stmt->execute()) {
                $result = $stmt->fetchAll(PDO::FETCH_OBJ);
                $data['remaining'] = (__MAX_DON_DAY__ - $result[0]->remaining);
                if ($data['remaining'] < 0) {
                    $data['remaining'] = 0;
                }
            }
            $db = null;
        } catch (PDOException $e) {
            $data = array('error' => array('text' => $e->getMessage()));
        }
    }
    header("Content-Type: application/json");
    echo json_encode($data);
}

function getPartnerRandom() {
    $data = array('partner' => null);
    $sql = 'SELECT p.* FROM t_partner p';
    try {
        $db = getConnection();
        $stmt = $db->query($sql);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $data['partner'] = $result[array_rand($result)];
        $db = null;
    } catch (PDOException $e) {
        $data = array('error' => array('text' => $e->getMessage()));
    }
    header("Content-Type: application/json");
    echo json_encode($data);
}

function getLastGoodeed() {
    $data = array('last_don' => null);
    $sql = 'SELECT g.*, u.first_name FROM t_goodeed g, t_user u WHERE u.id = g.user_id ORDER by g.id DESC LIMIT 0,1';
    try {
        $db = getConnection();
        $stmt = $db->query($sql);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (isset($result[0])) {
            $data['last_don'] = $result[0];
        }
        $db = null;
    } catch (PDOException $e) {
        $data = array('error' => array('text' => $e->getMessage()));
    }
    header("Content-Type: application/json");
    echo json_encode($data);
}

function makeGoodeed() {
    $request = \Slim\Slim::getInstance()->request();
    $infos = json_decode($request->getBody());
    $data = null;
    $sql = "INSERT INTO t_goodeed"
            . "(user_id, partner_id, type, date)"
            . " VALUES "
            . "(:user_id, :partner_id, :type, :date)";
    $date = $Date = date("Y-m-j H:i:s");
    try {
        if (!isset($infos->fb_id) || !isset($infos->partner_id) || !isset($infos->type)) {
            throw new PDOException('Error: bad informations');
        }
        $db = getConnection();
        $user = getUser($infos->fb_id, $db);
        if ($user === false) {
            throw new Exception('Error: user don\'t exists');
        }
        $stmt = $db->prepare($sql);
        $stmt->bindParam("user_id", $user->id);
        $stmt->bindParam("partner_id", $infos->partner_id);
        $stmt->bindParam("type", $infos->type);
        $stmt->bindParam("date", $date);
        $stmt->execute();
        $db = null;
        $data['success'] = true;
    } catch (PDOException $e) {
        $data = array('error' => array('text' => $e->getMessage()));
    }
    header("Content-Type: application/json");
    echo json_encode($data);
}

function getUser($fb_id, $db) {
    $sql = 'SELECT u.* FROM t_user u WHERE u.fb_id = :fb_id';
    try {
        $stmt = $db->prepare($sql);
        $stmt->bindParam("fb_id", $fb_id);
        if ($stmt->execute()) {
            $result = $stmt->fetchAll(PDO::FETCH_OBJ);
            if ($result) {
                return $result[0];
            }
        }
    } catch (PDOException $e) {
        return false;
    }
    return false;
}

function createUser($user, $db) {
    $data = null;
    $sql = "INSERT INTO t_user "
            . "(fb_id, email, first_name, last_name, gender, birthday, place, first_login, last_login)"
            . " VALUES "
            . "(:fb_id, :email, :first_name, :last_name, :gender, :birthday, :place, :first_login, :last_login)";
    $date = $Date = date("Y-m-j H:i:s");
    try {
        $stmt = $db->prepare($sql);
        $stmt->bindParam("fb_id", $user->id);
        $stmt->bindParam("email", $user->email);
        $stmt->bindParam("first_name", $user->first_name);
        $stmt->bindParam("last_name", $user->last_name);
        $stmt->bindParam("gender", $user->gender);
        $stmt->bindParam("birthday", $user->birthday);
        $stmt->bindParam("place", $user->location->name);
        $stmt->bindParam("first_login", $date);
        $stmt->bindParam("last_login", $date);
        $stmt->execute();
//        $data['userId'] = $db->lastInsertId();
    } catch (PDOException $e) {
        $data = array('error' => array('text' => $e->getMessage()));
    }
    if ($data) {
        header("Content-Type: application/json");
        echo json_encode($data);
    }
}

function updateUser($user, $db) {
    $data = null;
    $sql = 'UPDATE t_user SET last_login = :last_login WHERE id = :id';
    $date = date("Y-m-j H:i:s");
    try {
        $stmt = $db->prepare($sql);
        $stmt->bindParam("id", $user->id);
        $stmt->bindParam("last_login", $date);
        $stmt->execute();
    } catch (PDOException $e) {
        $data = array('error' => array('text' => $e->getMessage()));
    }
    if ($data) {
        header("Content-Type: application/json");
        echo json_encode($data);
    }
}

function syncUser($fb_id) {
    $data = array();
    $request = \Slim\Slim::getInstance()->request();
    $user = json_decode($request->getBody());
    try {
        if ($fb_id === '-42') {
            throw new PDOException('error: guest user');
        }
        $db = getConnection();
        $user_exists = getUser($fb_id, $db);
        if ($user_exists === false) {
            createUser($user, $db);
        } else {
            updateUser($user_exists, $db);
        }
        $data['success'] = true;
        $db = null;
    } catch (PDOException $e) {
        $data = array('error' => array('text' => $e->getMessage()));
    }
    header("Content-Type: application/json");
    echo json_encode($data);
}

// kernel functions
function getConnection() {
    $pdo_options = array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8');
    $dbhost = "127.0.0.1";
    $dbuser = "goodeedtiptop";
    $dbpass = "aqwLOL123";
    $dbname = "goodeedtiptop";
//    $dbhost = "127.0.0.1";
//    $dbuser = "root";
//    $dbpass = "";
//    $dbname = "goodeed";
    $dbh = new PDO("mysql:host=$dbhost;dbname=$dbname", $dbuser, $dbpass, $pdo_options);
    return $dbh;
}

// run REST Api
$app->run();
