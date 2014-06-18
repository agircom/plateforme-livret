<?php

function checkContactInfosPattern($givenContactInfos) {
    $patternContactInfos = array(
        'name',
        'last_name',
        'first_name',
        'email',
        'address',
        'cp',
        'city',
        'question'
    );
    if (count(array_diff($patternContactInfos, array_keys($givenContactInfos))) > 0) {
        return false;
    }
    foreach ($patternContactInfos as $infoKey) {
        if (is_null($givenContactInfos[$infoKey])) {
            return false;
        }
    }
    if (!isValidEmail($givenContactInfos['email'])) {
        return false;
    }
    return true;
}

function checkUserInfosCreatePattern($givenUserInfos) {
    $patternUserInfos = array(
        'name',
        'last_name',
        'first_name',
        'username',
        'address',
        'cp',
        'city',
        'passwd',
        'contract_accepted'
    );
    if (count(array_diff($patternUserInfos, array_keys($givenUserInfos))) > 0) {
        return false;
    }
    foreach ($patternUserInfos as $infoKey) {
        if (is_null($givenUserInfos[$infoKey])) {
            return false;
        }
    }
    if (!$givenUserInfos['contract_accepted']) {
        return false;
    }
    if (!isValidEmail($givenUserInfos['username'])) {
        return false;
    }
    return true;
}

function checkUserInfosUpdatePattern($givenUserInfos) {
    $patternUserInfos = array(
        'name',
        'last_name',
        'first_name',
        'address',
        'cp',
        'city'
    );
    if (count(array_diff($patternUserInfos, array_keys($givenUserInfos))) > 0) {
        return false;
    }
    foreach ($patternUserInfos as $infoKey) {
        if (is_null($givenUserInfos[$infoKey])) {
            return false;
        }
    }
    if (isset($givenUserInfos['passwd']) && is_null($givenUserInfos['passwd'])) {
        return false;
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
        } else {
            return $user_record;
        }
    }
    return false;
}

function retrieveAdminByToken() {
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
        } elseif (intval($user_record->permissions) !== 2) {
            // ressource forbidden
            $app->response()->status(403);
        } else {
            return $user_record;
        }
    }
    return false;
}

function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function random_password($length = 8) {
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    $password = substr(str_shuffle($chars), 0, $length);
    return $password;
}

function sendMail($dest, $subject, $body) {
    global $config;
    $mail = new PHPMailer();
    $mail->CharSet = 'UTF-8';
    $mail->IsSMTP();
    $mail->SMTPDebug = $config['smtp']['debug'];
    $mail->SMTPAuth = $config['smtp']['auth'];
//    $mail->SMTPSecure = $config['smtp']['secure'];
    $mail->Host = $config['smtp']['host'];
    $mail->Port = $config['smtp']['port'];
    $mail->Username = $config['smtp']['user'];
    $mail->Password = $config['smtp']['passwd'];
    $mail->isHTML(true);
    $mail->SetFrom($config['smtp']['from'], $config['smtp']['from_name']);
    $mail->addAddress($dest['mail'], $dest['name']);
    $mail->Subject = $subject;
    $mail->Body = $body;

    if (!$mail->Send()) {
//        echo 'Message could not be sent.';
//        echo 'Mailer Error: ' . $mail->ErrorInfo;
        return false;
    } else {
//        echo 'Message has been sent';
        return true;
    }
}

function sendContactEmail($dest, $contactinfos) {
    $subject = 'Contact';
    $body = 'Formulaire de contact, <br>';
    foreach ($contactinfos as $key => $value) {
        $body .= "$key : $value<br>";
    }
    return sendMail($dest, $subject, $body);
}

function sendAccountCreationConfirmEmail($dest, $confirm_key) {
    $subject = 'Création de votre compte pour créer votre livret d’accueil';
    $body = 'Cher (chère) ' . $dest['name'] . ', <br>';
    $body .= 'Pour valider compte, merci de cliquer sur le lien ci après (Si le lien ne fonctionne pas, copiez-le et collez-le dans votre navigateur.)<br><br>';
    $body .= '<a href="http://livret-accueil-haute-normandie.fr/index.html#/account/confirm/' . $confirm_key . '">http://livret-accueil-haute-normandie.fr/index.html#/account/confirm/' . $confirm_key . '</a> <br><br>';
    $body .= 'Votre compte sera alors immédiatement activé et vous pourrez commencer la création de votre livret.<br>';
    $body .= 'Le Réseau Rural Haut-Normand';
    return sendMail($dest, $subject, $body);
}

function sendAccountResetPasswdEmail($dest, $newPasswd) {
    $subject = 'Reinitialisation de votre mot de passe';
    $body = 'Cher (chère) ' . $dest['name'] . ', <br>';
    $body .= 'Vous avez souhaité réinitialiser votre mot de passe.<br>';
    $body .= 'Voici votre nouveau mot de passe: <b>' . $newPasswd . '</b> pour vous connecter.<br>';
    $body .= 'Vous pourrez ensuite facilement le personnaliser en cliquant sur Mon compte.<br>';
    $body .= 'Cordialement<br>Le Réseau Rural Haut-Normand';
    return sendMail($dest, $subject, $body);
}

function getFormatPDF($folio_type) {
    $format = '';
    switch ($folio_type) {
        case 'pochette':
            $format = 'A3-L';
            break;
        case 'agenda':
            $format = 'A4-L';
            break;
        default:
            $format = 'A4';
            break;
    }
    return $format;
}
