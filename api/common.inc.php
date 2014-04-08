<?php

define('__SALT__', '!P10p&42!');

function checkUserInfosCreatePattern($givenUserInfos) {
    $patternUserInfos = array(
        'username',
        'passwd',
        'firstName',
        'lastName'
    );
    if (count(array_diff($patternUserInfos, array_keys($givenUserInfos))) > 0) {
        return false;
    }
    foreach ($patternUserInfos as $infoKey) {
        if (is_null($givenUserInfos[$infoKey])) {
            return false;
        }
    }
    return true;
}

function retrieveUserByToken() {
    global $app;
    $user_record = null;
    // get session headers params
    $givenUser = $app->request->headers->get('App-User');
    $givenToken = $app->request->headers->get('App-Token');
    if (is_null($givenUser) || is_null($givenToken)) {
        // bad request parameters
        $app->response()->status(400);
    } else {
        // retrieve user by couple user_id/session_token
        $user_record = R::findOne('user', 'id=? AND session_token=?', array($givenUser, $givenToken));
        if (is_null($user_record)) {
            // bad session token
            $app->response()->status(401);
        }
    }
    return $user_record;
}

function retrieveBookletById($booklet_id) {
    global $app;
    $booklet_record = R::findOne('booklet', 'id=?', array($booklet_id));
    if (is_null($booklet_record)) {
        // booklet doesn't exist
        $app->response()->status(404);
    } else {
        return $booklet_record;
    }
}