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
                echo json_encode($data, JSON_NUMERIC_CHECK);
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
    echo json_encode($data, JSON_NUMERIC_CHECK);
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
            $user_record->name = $givenUserInfos['name'];
            $user_record->firstName = $givenUserInfos['firstName'];
            $user_record->lastName = $givenUserInfos['lastName'];
            $user_record->fonction = (isset($givenUserInfos['lastName'])) ? $givenUserInfos['lastName'] : null;
            $user_record->phone = (isset($givenUserInfos['phone'])) ? $givenUserInfos['phone'] : null;
            $user_record->address = $givenUserInfos['address'];
            $user_record->cp = $givenUserInfos['cp'];
            $user_record->contract_accepted = $givenUserInfos['contract_accepted'];
            $user_record->date_create = new DateTime();
            $user_record->date_last_connect = null;
            $user_record->session_token = null;
            $user_record->last_timestamp = null;
            $user_record->ownBookletList = array();
            $id = R::store($user_record);
            if (!is_int($id)) {
                $app->response()->status(202);
            } else {
                $app->response()->status(201);
            }
        }
    }
});

$app->get('/booklets', function() use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    // export user booklets
    $data = array('booklets' => R::exportAll($user_record->ownBooklet));
    echo json_encode($data, JSON_NUMERIC_CHECK);
});

$app->get('/booklet/:booklet_id', function($booklet_id) use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    $data = array('booklet' => false);
    // retrieve booklet by id
    $booklet_record = R::findOne('booklet', 'id=? && user=?', array($booklet_id, $user_record->id));
    if (!is_null($booklet_record)) {
        $data['booklet'] = $booklet_record->export();
    }
    echo json_encode($data, JSON_NUMERIC_CHECK);
});

$app->post('/booklet', function() use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    $data = json_decode($app->request->getBody(), true);
    if (!key_exists('name', $data) || is_null($data['name'])) {
        // bad params
        $app->response()->status(400);
    } else {
        $givenName = $data['name'];
        $date = new DateTime();
        // create new booklet
        $booklet_record = R::dispense('booklet');
        $booklet_record->name = $givenName;
        $booklet_record->ownFolioList = array();
        $booklet_record->date_create = $date;
        $booklet_record->date_last_update = null;
        // save booklet to user
        $user_record->ownBookletList[] = $booklet_record;
        R::store($user_record);
        $last_booklet = end($user_record->ownBooklet);
        $booklet_id = $last_booklet->id;
        echo json_encode(array('booklet_id' => $booklet_id), JSON_NUMERIC_CHECK);
    }
});

$app->delete('/booklet/:booklet_id', function($booklet_id) use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    // retrieve booklet
    if (!isset($user_record->ownBooklet[$booklet_id])) {
        // current user is not the booklet owner
        $app->response()->status(401);
    } else {
        // delete the booklet
        unset($user_record->ownBooklet[$booklet_id]);
        R::store($user_record);
    }
});

$app->post('/booklet/:booklet_id/folio/:folio_type', function($booklet_id, $folio_type) use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    // retrieve booklet
    $booklet_record = retrieveBookletById($booklet_id);
    if ($booklet_record->user !== $user_record->id) {
        // current user is not the booklet owner
        $app->response()->status(401);
    } else {
        // check if booklet already have folio type
        $present = false;
        foreach ($booklet_record->ownFolioList as $folio) {
            if ($folio->type === $folio_type) {
                $present = true;
            }
        }
        if ($present) {
            // folio type already exists for this booklet
            $app->response()->status(423);
        } else {
            // TODO: check if folio type template exists in database
            // create folio
            $folio_record = R::dispense('folio');
            $folio_record->type = $folio_type;
            $folio_record->content = 'folio template : ' . $folio_type;
//            $folio_id = R::store($folio_record);
            // update booklet with new folio
            $booklet_record->ownFolioList[] = $folio_record;
            echo json_encode(R::store($booklet_record), JSON_NUMERIC_CHECK);
        }
    }
});

// run REST Api
$app->run();
R::close();
