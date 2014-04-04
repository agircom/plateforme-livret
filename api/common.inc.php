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
    $givenUser = $app->request->headers->get('App-User');
    $givenToken = $app->request->headers->get('App-Token');
}
