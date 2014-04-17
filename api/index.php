<?php

//require_once 'RedBeanPHP' . DIRECTORY_SEPARATOR . 'rb.php';
require_once 'RedBeanPHP' . DIRECTORY_SEPARATOR . 'rb.phar';
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
    if (!$user_record) {
        return;
    }
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
            $user_record->cgu_accepted = $givenUserInfos['contract_accepted'];
            $user_record->confirmed = $givenUserInfos['contract_accepted'];
            $user_record->date_create = new DateTime();
            $user_record->date_confirm = null;
            $user_record->date_last_connect = null;
            $user_record->session_token = null;
            $user_record->last_timestamp = null;
            $user_record->xownBookletList = array();
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
    if (!$user_record) {
        return;
    }
    // export user booklets
    $data = array('booklets' => R::exportAll($user_record->xownBookletList));
    echo json_encode($data, JSON_NUMERIC_CHECK);
});

$app->get('/booklet/:booklet_id', function($booklet_id) use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
    // retrieve booklet
    if (!isset($user_record->xownBookletList[$booklet_id])) {
        // booklet doesn't exist or is not the owner
        $app->response()->status(404);
    } else {
        // send back booklet infos
        $data = array('booklet' => $user_record->xownBookletList[$booklet_id]->export());
        echo json_encode($data, JSON_NUMERIC_CHECK);
    }
});

$app->post('/booklet', function() use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
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
        $booklet_record->xownFolioList = array();
        $booklet_record->date_create = $date;
        $booklet_record->date_last_update = null;
        // save booklet to user
        $user_record->xownBookletList[] = $booklet_record;
        R::store($user_record);
        $last_booklet = end($user_record->xownBookletList);
        $booklet_id = $last_booklet->id;
        echo json_encode(array('booklet_id' => $booklet_id), JSON_NUMERIC_CHECK);
    }
});

$app->post('/booklet/:booklet_id/duplicate', function($booklet_id) use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
    // retrieve booklet
    if (!isset($user_record->xownBookletList[$booklet_id])) {
        // booklet doesn't exist or is not the owner
        $app->response()->status(404);
    } else {
        // duplicate booklet
        $new_booklet_record = R::dup($user_record->xownBookletList[$booklet_id]);
        $new_booklet_record->name .= ' (copie du ' . date('d-m-Y \a H:i') . ')';
        // store new booklet
        $user_record->xownBookletList[] = $new_booklet_record;
        R::store($user_record);
        $last_booklet = end($user_record->xownBookletList);
        $booklet_id = $last_booklet->id;
        echo json_encode(array('booklet_id' => $booklet_id), JSON_NUMERIC_CHECK);
    }
});

$app->delete('/booklet/:booklet_id', function($booklet_id) use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
    // retrieve booklet
    if (!isset($user_record->xownBookletList[$booklet_id])) {
        // booklet doesn't exist or is not the owner
        $app->response()->status(404);
    } else {
        // delete the booklet
        unset($user_record->xownBookletList[$booklet_id]);
        R::store($user_record);
    }
});

$app->post('/booklet/:booklet_id/folio/:folio_type', function($booklet_id, $folio_type) use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
    // retrieve booklet
    if (!isset($user_record->xownBookletList[$booklet_id])) {
        // booklet doesn't exist or is not the owner
        $app->response()->status(404);
    } else {
        $booklet_record = $user_record->xownBookletList[$booklet_id];
        $present = false;
        foreach ($booklet_record->xownFolioList as $folio) {
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
            $date = new DateTime();
            $folio_record = R::dispense('folio');
            $folio_record->type = $folio_type;
            if ($folio_type === 'folio2') {
                $data = json_decode($app->request->getBody(), true);
                $folio_template = $data['folio_type_template'];
                $folio_record->content = 'folio template : ' . $folio_type . ' template name : ' . $folio_template;
            } else {
                $folio_record->content = 'folio template : ' . $folio_type;
            }
            $folio_record->date_create = $date;
            $folio_record->date_last_update = null;
            // save folio to booklet
            $booklet_record->xownFolioList[] = $folio_record;
            R::store($booklet_record);
            $last_folio = end($booklet_record->xownFolioList);
            $folio_id = $last_folio->id;
            echo json_encode(array('folio_id' => $folio_id), JSON_NUMERIC_CHECK);
        }
    }
});

$app->get('/booklet/:booklet_id/folio/:folio_id', function($booklet_id, $folio_id) use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
    // retrieve booklet
    if (!isset($user_record->xownBookletList[$booklet_id])) {
        // booklet doesn't exist or is not the owner
        $app->response()->status(404);
    } else {
        // retrieve folio booklet
        if (!isset($user_record->xownBookletList[$booklet_id]->xownFolioList[$folio_id])) {
            // folio booklet doesn't exist or is not the owner
            $app->response()->status(404);
        } else {
            $folio_record = $user_record->xownBookletList[$booklet_id]->xownFolioList[$folio_id];
            echo json_encode(array('folio' => $folio_record->export()), JSON_NUMERIC_CHECK);
        }
    }
});

// run REST Api
$app->run();
R::close();
