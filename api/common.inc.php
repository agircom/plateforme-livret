<?php

function checkUserInfosCreatePattern($givenUserInfos) {
    $patternUserInfos = array(
        'name',
        'lastName',
        'firstName',
        'username',
        'address',
        'cp',
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
    $mail->IsSMTP();
    $mail->SMTPDebug = $config['smtp']['debug'];
    $mail->SMTPAuth = $config['smtp']['auth'];
    $mail->SMTPSecure = $config['smtp']['secure'];
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

function sendAccountCreationConfirmEmail($dest, $confirm_key) {
    $subject = 'Confirmation creation de compte';
    $body = 'Cher (chère) ' . $dest['name'] . ', <br>';
    $body .= 'Votre compte a été créé avec succès.<br>';
    $body .= 'Pour confirmer votre compte et commencer la creation d\'un livret vueillez cliquer sur ce lien: <br>';
    $body .= '<a href="http://localhost/agircom/plateforme-livret/index.html#/account/confirm/' . $confirm_key . '">lien d\'activation</a> <br><br>';
    $body .= 'Le Réseau Rural Haut-Normand';
    return sendMail($dest, $subject, $body);
}

function sendAccountResetPasswdEmail($dest, $newPasswd) {
    $subject = 'Reinitialisation de votre mot de passe';
    $body = 'Cher (chère) ' . $dest['name'] . ', <br>';
    $body .= 'Vous avez souhaité réinitialiser votre mot de passe.<br>';
    $body .= 'Voici votre nouveau mot de passe: <b>' . $newPasswd . '</b><br>';
    $body .= 'Cordialement<br>Le Réseau Rural Haut-Normand';
    return sendMail($dest, $subject, $body);
}
