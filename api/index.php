<?php

// Api config
$config = include_once 'config.inc.php';
// Api includes
require_once 'RedBeanPHP' . DIRECTORY_SEPARATOR . 'rb.phar';
R::setup('mysql:host=' . $config['bdd']['host'] . ';dbname=' . $config['bdd']['name'], $config['bdd']['user'], $config['bdd']['passwd']);

require_once 'Slim' . DIRECTORY_SEPARATOR . 'Slim.php';
\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim();
$app->response->headers->set('Content-Type', 'application/json');

require_once 'PHPMailer' . DIRECTORY_SEPARATOR . 'PHPMailerAutoload.php';

require_once 'common.inc.php';

// REST Api post contact
$app->post('/contact', function() use ($app) {
    // get params
    $data = json_decode($app->request->getBody(), true);
    $givenContactInfos = $data['contactInfos'];
    if (is_null($givenContactInfos) || !checkContactInfosPattern($givenContactInfos)) {
        // missing params
        $app->response()->status(400);
        return;
    }
    $mail_data = array();
    $mail_data['mail'] = 'thomas.beauvallet@gmail.com';
    $mail_data['name'] = 'Thomas Beauvallet';
    sendContactEmail($mail_data, $givenContactInfos);
});

// REST Api get session token
$app->get('/token', function() use ($app) {
    // get params
    $givenUser = $app->request->get('user');
    $givenPasswd = $app->request->get('passwd');
    $givenTimestamp = $app->request->get('timestamp');
    if (!isset($givenUser) || !isset($givenPasswd) || !isset($givenTimestamp)) {
        // bad request params
        $app->response()->status(400);
        return;
    }
    // check user credentials
    $user_record = R::findOne('user', 'username=? AND passwd=? AND confirmed=?', array($givenUser, $givenPasswd, true));
    if (is_null($user_record)) {
        // unknown user
        $app->response()->status(403);
        return;
    }
    // check last timestamp
    if ($user_record->last_timestamp === $givenTimestamp) {
        // request already executed
        $app->response()->status(406);
        return;
    }
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
});

// REST Api get user
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
    echo json_encode($data);
});

// REST Api create user
$app->post('/user', function() use($app) {
    // get user infos
    $data = json_decode($app->request->getBody(), true);
    $givenUserInfos = $data['userInfos'];
    if (is_null($givenUserInfos) || !checkUserInfosCreatePattern($givenUserInfos)) {
        // missing params
        $app->response()->status(400);
        return;
    }
    // check if user already exists
    $userExists = R::findOne('user', 'username=?', array($givenUserInfos['username']));
    if (!is_null($userExists)) {
        // username exists
        $app->response()->status(423);
        return;
    }
    $confirm_key = md5(uniqid(mt_rand(), true));
    // create new user
    $user_record = R::dispense('user');
    $user_record->username = $givenUserInfos['username'];
    $user_record->passwd = $givenUserInfos['passwd'];
    $user_record->name = $givenUserInfos['name'];
    $user_record->first_name = $givenUserInfos['first_name'];
    $user_record->last_name = $givenUserInfos['last_name'];
    $user_record->fonction = (isset($givenUserInfos['fonction'])) ? $givenUserInfos['fonction'] : null;
    $user_record->phone = (isset($givenUserInfos['phone'])) ? $givenUserInfos['phone'] : null;
    $user_record->address = $givenUserInfos['address'];
    $user_record->cp = $givenUserInfos['cp'];
    $user_record->cgu_accepted = $givenUserInfos['contract_accepted'];
    $user_record->confirmed = false;
    $user_record->confirm_date = null;
    $user_record->confirm_key = $confirm_key;
    $user_record->date_create = new DateTime();
    $user_record->date_last_connect = null;
    $user_record->session_token = null;
    $user_record->last_timestamp = null;
    $user_record->xownBookletList = array();
    $user_record->setMeta("cast.phone","string");
    $user_record->setMeta("cast.cp","string");
    R::store($user_record);
    $mail_data = array();
    $mail_data['mail'] = $user_record->username;
    $mail_data['name'] = $user_record->firstName . ' ' . $user_record->lastName;
    sendAccountCreationConfirmEmail($mail_data, $confirm_key);
    $app->response()->status(201);
});

// REST Api confirm user
$app->put('/user/confirm/:confirm_key', function($confirm_key) use ($app) {
    // get user by confirm_key
    $user_record = R::findOne('user', 'confirm_key=?', array($confirm_key));
    if (is_null($user_record)) {
        // can't find user
        $app->response()->status(404);
        return;
    }
    $user_record->confirmed = true;
    $user_record->confirm_date = new DateTime();
    $user_record->confirm_key = null;
    R::store($user_record);
    $app->response(200);
});

// REST Api reset user passwd
$app->post('/user/resetpasswd', function() use ($app, $config) {
    // get params
    $data = json_decode($app->request->getBody(), true);
    $givenUsername = $data['username'];
    $user_record = R::findOne('user', 'username=? AND confirmed=?', array($givenUsername, true));
    if (is_null($user_record)) {
        // unknown user or not confirmed
        $app->response()->status(404);
        return;
    }
    $newPasswd = random_password();
    $user_record->passwd = sha1(sha1($newPasswd) . $config['app']['salt']);
    R::store($user_record);
    $mail_data = array();
    $mail_data['mail'] = $user_record->username;
    $mail_data['name'] = $user_record->first_name . ' ' . $user_record->last_name;
    sendAccountResetPasswdEmail($mail_data, $newPasswd);
});

// REST Api get user booklets
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

// REST Api get booklet by id
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
        return;
    }
    // send back booklet infos
    $data = array('booklet' => $user_record->xownBookletList[$booklet_id]->export());
    echo json_encode($data, JSON_NUMERIC_CHECK);
});

// REST Api create booklet
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
        return;
    }
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
});

// REST Api duplicate booklet
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
        return;
    }
    // duplicate booklet
    $new_booklet_record = R::dup($user_record->xownBookletList[$booklet_id]);
    $new_booklet_record->name .= ' (copie du ' . date('d-m-Y \a H:i') . ')';
    // store new booklet
    $user_record->xownBookletList[] = $new_booklet_record;
    R::store($user_record);
    $last_booklet = end($user_record->xownBookletList);
    $booklet_id = $last_booklet->id;
    echo json_encode(array('booklet_id' => $booklet_id), JSON_NUMERIC_CHECK);
});

// REST Api delete booklet
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
        return;
    }
    // delete the booklet
    unset($user_record->xownBookletList[$booklet_id]);
    R::store($user_record);
});

// REST Api create booklet folio
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
        return;
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
            return;
        }
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
});

// REST Api get booklet folio by id
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
        return;
    }
    // retrieve folio booklet
    if (!isset($user_record->xownBookletList[$booklet_id]->xownFolioList[$folio_id])) {
        // folio booklet doesn't exist or is not the owner
        $app->response()->status(404);
        return;
    }
    $folio_record = $user_record->xownBookletList[$booklet_id]->xownFolioList[$folio_id];
    echo json_encode(array('folio' => $folio_record->export()), JSON_NUMERIC_CHECK);
});

// run REST Api
$app->run();
R::close();
