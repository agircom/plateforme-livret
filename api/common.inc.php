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

function sendAccountCreationConfirmEmail($dest) {
    $subject = 'Confirmation creation de compte';
    $body = 'Cher (chère) ' . $dest['name'] . ', <br>';
    $body .= 'Votre compte a été créé avec succès.<br>';
    $body .= 'Pour confirmer votre compte et commencer la creation d\'un livret vueillez cliquer sur ce lien: <br>';
    $body .= '<a href="http://localhost/agircom/plateforme-livret/index.html#/account/confirm/'.$dest['confirm_key'].'">lien d\'activation</a> <br><br>';
    $body .= 'Le Réseau Rural Haut-Normand';
    return sendMail($dest, $subject, $body);
}

function sendAccountCreationConfirm($dest) {
    $to = $dest;
    $from = __MAIL_FROM__;
    $day = date("Y-m-d");
    $hour = date("H:i");
    $Subject = "Test Mail - $day $hour";
    $mail_Data = "";
    $mail_Data .= "<html> \n";
    $mail_Data .= "<head> \n";
    $mail_Data .= "<title> Subject </title> \n";
    $mail_Data .= "</head> \n";
    $mail_Data .= "<body> \n";
    $mail_Data .= "Mail HTML simple  : <b>$Subject </b> <br> \n";
    $mail_Data .= "<br> \n";
    $mail_Data .= "bla bla <font color=red> bla </font> bla <br> \n";
    $mail_Data .= "Etc.<br> \n";
    $mail_Data .= "</body> \n";
    $mail_Data .= "</HTML> \n";
    $headers = "MIME-Version: 1.0 \n";
    $headers .= "Content-type: text/html; charset=iso-8859-1 \n";
    $headers .= "From: $from  \n";
    $headers .= "Disposition-Notification-To: $from  \n";
    // high priority
    $headers .= "X-Priority: 1  \n";
    $headers .= "X-MSMail-Priority: High \n";
    $CR_Mail = TRUE;
    $CR_Mail = @mail($to, $Subject, $mail_Data, $headers);
    if ($CR_Mail === FALSE) {
        echo " ### CR_Mail=$CR_Mail - Erreur envoi mail <br> \n";
    } else {
        echo " *** CR_Mail=$CR_Mail - Mail envoyé<br> \n";
    }
}
