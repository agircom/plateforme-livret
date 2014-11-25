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
    $mail_data['mail'] = 'contact@livret-accueil-haute-normandie.fr';
    $mail_data['name'] = 'Contact Plateforme Livret Accueil Haute Normandie';
    if (!sendContactEmail($mail_data, $givenContactInfos)) {
        $app->response()->status(500);
    }
});

/*
 * 
 * API USER
 * 
 */
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
    $user_record->city = $givenUserInfos['city'];
    $user_record->permissions = 1;
    $user_record->cgu_accepted = $givenUserInfos['contract_accepted'];
    $user_record->confirmed = false;
    $user_record->confirm_date = null;
    $user_record->confirm_key = $confirm_key;
    $user_record->date_create = new DateTime();
    $user_record->date_last_connect = null;
    $user_record->session_token = null;
    $user_record->last_timestamp = null;
    $user_record->xownBookletList = array();
    $user_record->xownLibraryList = array();
    $user_record->setMeta("cast.phone", "string");
    $user_record->setMeta("cast.cp", "string");
    R::store($user_record);
    $mail_data = array();
    $mail_data['mail'] = $user_record->username;
    $mail_data['name'] = $user_record->firstName . ' ' . $user_record->lastName;
    sendAccountCreationConfirmEmail($mail_data, $confirm_key);
    $app->response()->status(201);
});

// REST Api update user
$app->put('/user', function() use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
    // get parameters
    $data = json_decode($app->request->getBody(), true);
    $givenUserInfos = $data['userInfos'];
    if (is_null($givenUserInfos) || !checkUserInfosUpdatePattern($givenUserInfos)) {
        // missing params
        $app->response()->status(400);
        return;
    }
    $user_record->name = $givenUserInfos['name'];
    $user_record->first_name = $givenUserInfos['first_name'];
    $user_record->last_name = $givenUserInfos['last_name'];
    $user_record->fonction = (isset($givenUserInfos['fonction'])) ? $givenUserInfos['fonction'] : null;
    $user_record->phone = (isset($givenUserInfos['phone'])) ? $givenUserInfos['phone'] : null;
    $user_record->address = $givenUserInfos['address'];
    $user_record->cp = $givenUserInfos['cp'];
    $user_record->city = $givenUserInfos['city'];
    if (isset($givenUserInfos['passwd'])) {
        $user_record->passwd = $givenUserInfos['passwd'];
    }
    R::store($user_record);
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

/*
 * 
 * API BOOKLETS
 * 
 */

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

/*
 * 
 * API FOLIOS
 * 
 */

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
//    echo json_encode(array('folio' => $folio_record->export()), JSON_NUMERIC_CHECK);
    echo json_encode(array('folio' => R::exportAll($user_record->xownBookletList[$booklet_id]->xownFolioList[$folio_id])), JSON_NUMERIC_CHECK);
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
    }
    $booklet_record = $user_record->xownBookletList[$booklet_id];
    foreach ($booklet_record->xownFolioList as $folio) {
        if ($folio->type === $folio_type) {
            // folio type already exists for this booklet
            $app->response()->status(423);
            return;
        }
    }
    // check if folio type template exists in database
    $template_folio_record = R::findOne('templatefolio', 'type=?', array($folio_type));
    if (is_null($template_folio_record)) {
        // folio type template doesn't exist 
        $app->response()->status(415);
        return;
    }
    // create folio
    $date = new DateTime();
    $folio_record = R::dispense('folio');
    $folio_record->type = $folio_type;
    $folio_record->xownPageList = array();
    $folio_record->date_create = $date;
    $folio_record->date_last_update = null;
    // copy page from templates
    foreach ($template_folio_record->xownTemplatepageList as $tpl_page) {
        $page_record = R::dispense('page');
        $page_record->order = $tpl_page->order;
        $page_record->content = $tpl_page->content;
        $folio_record->xownPageList[] = $page_record;
    }
    // save folio to booklet
    $booklet_record->xownFolioList[] = $folio_record;
    R::store($booklet_record);
    $last_folio = end($booklet_record->xownFolioList);
    $folio_id = $last_folio->id;
    echo json_encode(array('folio_id' => $folio_id), JSON_NUMERIC_CHECK);
});

// REST Api update booklet folio
$app->put('/booklet/:booklet_id/folio/:folio_id', function($booklet_id, $folio_id) use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
    // get params
    $data = json_decode($app->request->getBody(), true);
    if (!key_exists('folio_data', $data) || is_null($data['folio_data'])) {
        // bad params
        $app->response()->status(400);
        return;
    }
    $givenFolioData = $data['folio_data'];
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
    if ($folio_record->type === 'locale') {
        $folio_record->xownPageList = array();
        foreach ($givenFolioData as $page) {
            $page_record = R::dispense('page');
            $page_record->order = $page['order'];
            $page_record->content = $page['content'];
            $folio_record->xownPageList[] = $page_record;
        }
        R::store($folio_record);
    } else {
        foreach ($givenFolioData as $page) {
            if (!isset($folio_record->xownPageList[$page['id']])) {
                // page doesn't exist or is not the owner
                $app->response()->status(404);
                return;
            }
            $page_record = $folio_record->xownPageList[$page['id']];
            $page_record->content = $page['content'];
            R::store($page_record);
        }
    }
    $date = new DateTime();
    $folio_record->date_last_update = $date;
    R::store($folio_record);
});

// REST Api generate PDF from folio content
$app->get('/booklet/:booklet_id/folio/:folio_id/export/:quality', function($booklet_id, $folio_id, $quality) use ($app) {
    // retrieve booklet
    $booklet_record = R::findOne('booklet', 'id=?', array($booklet_id));
    if (is_null($booklet_record)) {
        // booklet doesn't exist or is not the owner
        $app->response()->status(404);
        return;
    }
    // retrieve folio booklet
    if (!isset($booklet_record->xownFolioList[$folio_id])) {
        // folio booklet doesn't exist or is not the owner
        $app->response()->status(404);
        return;
    }
    $folio_record = $booklet_record->xownFolioList[$folio_id];

    require_once './mPDF/mpdf.php';
    $format = getFormatPDF($folio_record->type);
//    $mpdf = new mPDF('utf-8', $format);
    $mpdf = new mPDF('', $format, '', '', 0, 0, 0, 0, 0, 0);
//    $filename = 'livret';
    switch ($folio_record->type) {
        case 'locale':
            $filename = 'offre-locale';
            break;
        case 'territoire1':
            $filename = 'presentation-territoire';
            break;
        case 'territoire2':
            $filename = 'presentation-territoire';
            break;
        case 'territoire3':
            $filename = 'presentation-territoire';
            break;
        case 'ensemble':
            $filename = 'bien-vivre-ensemble';
            break;
        default:
            $filename = $folio_record->type;
            break;
    }
    if ($quality === 'hq') {
        $mpdf->dpi = 300;
        $mpdf->img_dpi = 300;
        $mpdf->SetCompression(false);
        $filename .= ' (HQ)';
    }
    $mpdf->SetAutoFont();
    $stylesheet = file_get_contents('..' . DIRECTORY_SEPARATOR . 'css' . DIRECTORY_SEPARATOR . 'styles_pdf.css');
    $mpdf->WriteHTML($stylesheet, 1);
    $stylesheet = file_get_contents('..' . DIRECTORY_SEPARATOR . 'css' . DIRECTORY_SEPARATOR . 'styles.css');
    $mpdf->WriteHTML($stylesheet, 1);
//    $stylesheet = file_get_contents('..' . DIRECTORY_SEPARATOR . 'css' . DIRECTORY_SEPARATOR . 'styles_bo.css');
//    $mpdf->WriteHTML($stylesheet, 1);
    foreach ($folio_record->xownPageList as $page) {
        $html = '<style>@page {margin: 0;padding:0;} body {font-family: "Lato" !important;}</style>';
        $html .= '<div style="margin:0;padding:0;">';
        $content = preg_replace('/<img([^>]+)src\=\"([^\"]*)\"/', "<img$1src=\"../$2\"", $page->content);
        //$content = preg_replace('#<img(.*?)src="([^"]*/)"([^>]*?)>#', '<img\\1src="../\\2"\\3>', $page-content);
        //$content = preg_replace('/<img([^>]+)src="([^"]+)"/i','<img$1src="../$2"', $page-content);
        $html .= $content;
        $html .= '</div>';
        //$mpdf->SetFooter('Document Title');
        $mpdf->WriteHTML($html);
        if ($page->id !== end($folio_record->xownPageList)->id) {
            $mpdf->AddPage('c', $format, '', '', 0, 0, 0, 0, 0, 0);
        }
    }
    $mpdf->debug = true;
    $mpdf->showImageErrors = true;
    $mpdf->Output($filename . '.pdf', 'D');
    exit;
});

/*
 * 
 * API Library
 * 
 */

// REST Api get images library by user
$app->get('/library', function() use($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
    // export user library
    $data = array('library' => R::exportAll($user_record->xownLibraryList));
    echo json_encode($data);
});

// REST Api get all user images library
$app->get('/library/all', function() use($app) {
    // retrieve user
    $user_record = retrieveAdminByToken();
    if (!$user_record) {
        return;
    }
    // export all users library
    $pictures = R::findAll('library', 'librarycategory_id IS NULL ORDER BY date_create DESC');
    $data = array('library' => R::exportAll($pictures));
    echo json_encode($data);
});

// REST Api get images by category
$app->get('/library/cat/:cat_id', function($cat_id) use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
    $library_category_record = R::findOne('librarycategory', 'id=?', array($cat_id));
    if (is_null($library_category_record)) {
        $app->response()->status(404);
        return;
    }
    $data = array(
        'name' => $library_category_record->name,
        'library' => R::exportAll($library_category_record->ownLibraryList)
    );
    echo json_encode($data);
});

// REST Api upload image into user library        
$app->post('/library', function() use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
    $postData = $app->request->post();
    if (!key_exists('name', $postData) || is_null($postData['name']) || !key_exists('description', $postData) || is_null($postData['description']) || !key_exists('image', $_FILES)) {
        // bad params
        $app->response()->status(400);
        return;
    }
    $givenName = $postData['name'];
    $givenDescription = $postData['description'];
    $givenCredits = (key_exists('credits', $postData)) ? $postData['credits'] : '';
    $givenImage = $_FILES['image'];
    if ($givenImage['error'] !== 0) {
        // image error
        $app->response()->status(406);
        echo json_encode(array('error' => 'Erreur lors de l\'envoi du fichier (code ' . $givenImage['error'] . ').'));
        return;
    }
    if ($givenImage['size'] > 5000000) {
        // image error
        $app->response()->status(406);
        echo json_encode(array('error' => 'Le fichier est trop volumineux. Poids accepté : jusqu\'à 5 mégas.'));
        return;
    }
    if (!getimagesize($givenImage['tmp_name'])) {
        // image error
        $app->response()->status(406);
        echo json_encode(array('error' => 'Le fichier n\'est pas une image.'));
        return;
    }
    $ext = pathinfo($givenImage['name'], PATHINFO_EXTENSION);
    $filename = $user_record->id . '_' . md5(uniqid(mt_rand(), true)) . '.' . $ext;
    $date = new DateTime();
    $path = '..' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'uploaded' . DIRECTORY_SEPARATOR;
    if (is_dir($path) || mkdir($path)) {
        @move_uploaded_file($givenImage['tmp_name'], $path . $filename);
    }
    $library_record = R::dispense('library');
    $library_record->name = $givenName;
    $library_record->description = $givenDescription;
    $library_record->credits = $givenCredits;
    $library_record->filename = $filename;
    $library_record->date_create = $date;
    $user_record->xownLibraryList[] = $library_record;
    R::store($user_record);
});

// REST Api upload image into category
$app->post('/library/cat/:cat_id', function($cat_id) use ($app) {
    // retrieve user
    $user_record = retrieveAdminByToken();
    if (!$user_record) {
        return;
    }
    $postData = $app->request->post();
    if (!key_exists('name', $postData) || is_null($postData['name']) || !key_exists('description', $postData) || is_null($postData['description']) || !key_exists('image', $_FILES)) {
        // bad params
        $app->response()->status(400);
        return;
    }
    $library_category_record = R::findOne('librarycategory', 'id=?', array($cat_id));
    if (is_null($library_category_record)) {
        $app->response()->status(404);
        return;
    }
    $givenName = $postData['name'];
    $givenDescription = $postData['description'];
    $givenCredits = (key_exists('credits', $postData)) ? $postData['credits'] : '';
    $givenImage = $_FILES['image'];
    if ($givenImage['error'] !== 0) {
        // image error
        $app->response()->status(406);
        echo json_encode(array('error' => 'Erreur lors de l\'envoi du fichier (code ' . $givenImage['error'] . ').'));
        return;
    }
    if ($givenImage['size'] > 5000000) {
        // image error
        $app->response()->status(406);
        echo json_encode(array('error' => 'Le fichier est trop volumineux.'));
        return;
    }
    if (!getimagesize($givenImage['tmp_name'])) {
        // image error
        $app->response()->status(406);
        echo json_encode(array('error' => 'Le fichier n\'est pas une image.'));
        return;
    }
    $ext = pathinfo($givenImage['name'], PATHINFO_EXTENSION);
    $filename = $user_record->id . '_' . md5(uniqid(mt_rand(), true)) . '.' . $ext;
    $date = new DateTime();
    $path = '..' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'library' . DIRECTORY_SEPARATOR;
    if (is_dir($path) || mkdir($path)) {
        @move_uploaded_file($givenImage['tmp_name'], $path . $filename);
    }
    $library_record = R::dispense('library');
    $library_record->name = $givenName;
    $library_record->description = $givenDescription;
    $library_record->credits = $givenCredits;
    $library_record->filename = $filename;
    $library_record->date_create = $date;
    $user_record->xownLibraryList[] = $library_record;
    R::store($user_record);
    $library_category_record->ownLibraryList[] = $library_record;
    R::store($library_category_record);
});

// REST Api import image from user library to category library
$app->post('/library/import/:cat_id', function($cat_id) use ($app) {
    // retrieve user
    $user_record = retrieveAdminByToken();
    if (!$user_record) {
        return;
    }
    $postData = json_decode($app->request->getBody(), true);
    if (!key_exists('name', $postData) || is_null($postData['name']) || !key_exists('description', $postData) || is_null($postData['description']) || !key_exists('filename', $postData) || is_null($postData['filename'])) {
        // bad params
        $app->response()->status(400);
        return;
    }
    $librarycategory_record = R::load('librarycategory', $cat_id);
    if (is_null($librarycategory_record)) {
        // unkown librarycategory
        $app->response()->status(404);
        return;
    }
    $date = new DateTime();
    $ext = pathinfo($postData['filename'], PATHINFO_EXTENSION);
    $filename = $user_record->id . '_' . md5(uniqid(mt_rand(), true)) . '.' . $ext;
    $library_record = R::dispense('library');
    $library_record->name = $postData['name'];
    $library_record->description = $postData['description'];
    $library_record->filename = $filename;
    $library_record->credits = (key_exists('credits', $postData)) ? $postData['credits'] : '';
    $library_record->date_create = $date;
    $user_record->xownLibraryList[] = $library_record;
    R::store($user_record);
    $librarycategory_record->ownLibraryList[] = $library_record;
    R::store($librarycategory_record);
    $pathSrc = '..' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'uploaded' . DIRECTORY_SEPARATOR;
    $pathDst = '..' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'library' . DIRECTORY_SEPARATOR;
    @copy($pathSrc . $postData['filename'], $pathDst . $filename);
});

// REST Api update image
$app->put('/library/:image_id', function($image_id) use ($app) {
    $putData = json_decode($app->request->getBody(), true);
    $library_record = R::findOne('library', 'id=?', array($image_id));
    if (is_null($library_record)) {
        $app->reponse()->status(404);
        return;
    }
    if (!key_exists('name', $putData) || is_null($putData['name']) || !key_exists('description', $putData) || is_null($putData['description'])) {
        // bad params
        $app->response()->status(400);
        return;
    }
    $user_record = null;
    if (is_null($library_record->librarycategory_id)) {
        // user picture
        $user_record = retrieveUserByToken();
        if (!$user_record) {
            return;
        }
        $library_record->name = $putData['name'];
        $library_record->description = $putData['description'];
        if (key_exists('credits', $putData) && !is_null($putData['credits'])) {
            $library_record->credits = $putData['credits'];
        }
        R::store($library_record);
    } else {
        // category picture
        if (!key_exists('librarycategory_id', $putData) || is_null($putData['librarycategory_id'])) {
            // bad params
            $app->response()->status(400);
            return;
        }
        $user_record = retrieveAdminByToken();
        if (!$user_record) {
            return;
        }
        $library_record->name = $putData['name'];
        $library_record->description = $putData['description'];
        if (key_exists('credits', $putData) && !is_null($putData['credits'])) {
            $library_record->credits = $putData['credits'];
        }
        if (intval($putData['librarycategory_id']) !== $library_record->librarycategory_id) {
            $librarycategory_record1 = R::load('librarycategory', $library_record->librarycategory_id);
            unset($librarycategory_record1->ownLibraryList[$library_record->id]);
            R::store($librarycategory_record1);
            $librarycategory_record2 = R::load('librarycategory', intval($putData['librarycategory_id']));
            $librarycategory_record2->ownLibraryList[] = $library_record;
            R::store($librarycategory_record2);
        }
    }
});

// REST Api delete user library image
$app->delete('/library/:image_id', function($image_id) use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
    // retrieve image
    $library_record = R::load('library', $image_id);
    if (is_null($library_record)) {
        $app->reponse()->status(404);
        return;
    }
    if (!is_null($library_record->librarycategory_id) || !isset($user_record->xownLibraryList[$image_id])) {
        $user_record = retrieveAdminByToken();
        if (!$user_record) {
            return;
        }
        if (!is_null($library_record->librarycategory_id)) {
            // remove file
            @unlink('..' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'library' . DIRECTORY_SEPARATOR . $library_record->filename);
        } else {
            @unlink('..' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'uploaded' . DIRECTORY_SEPARATOR . $library_record->filename);
        }
        // delete the library item
        $user_owner = R::load('user', $library_record->user_id);
        unset($user_owner->xownLibraryList[$image_id]);
        R::store($user_owner);
    } elseif (isset($user_record->xownLibraryList[$image_id])) {
        // remove file
        @unlink('..' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'uploaded' . DIRECTORY_SEPARATOR . $user_record->xownLibraryList[$image_id]->filename);
        // delete the library item
        unset($user_record->xownLibraryList[$image_id]);
        R::store($user_record);
    } else {
        // library item doesn't exist or is not the owner
        $app->response()->status(403);
        return;
    }
});

// REST Api get library categories
$app->get('/library/cats', function() use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
    // export library categories
    $data = R::exportAll(R::findAll('librarycategory'));
    foreach ($data as $key => $value) {
        if (isset($value['ownLibrary'])) {
            $data[$key]['ownLibrary'] = count($value['ownLibrary']);
        } else {
            $data[$key]['ownLibrary'] = 0;
        }
    }
    echo json_encode(array('categories' => $data));
});


/*
 * 
 * API Admin
 * 
 */
// REST Api admin get stats
$app->get('/admin/stats', function() use ($app) {
    // retrieve user
    $user_record = retrieveAdminByToken();
    if (!$user_record) {
        return;
    }
    $stats = array();
    $stats['users_confirmed'] = R::count('user', 'confirmed=?', array(1));
    $stats['users_not_confirmed'] = R::count('user', 'confirmed=?', array(0));
    $stats['booklets'] = R::count('booklet');
    $stats['pictures'] = R::count('library');
    echo json_encode($stats);
});
// REST Api admin get users
$app->get('/admin/users', function() use ($app) {
    // retrieve user
    $user_record = retrieveAdminByToken();
    if (!$user_record) {
        return;
    }
    $user_list_record = R::findAll('user');
    $user_list = R::exportAll($user_list_record);
    foreach (array_keys($user_list) as $key) {
        unset($user_list[$key]['passwd']);
        unset($user_list[$key]['confirm_key']);
        unset($user_list[$key]['confirm_date']);
        unset($user_list[$key]['last_timestamp']);
        unset($user_list[$key]['session_token']);
        if (isset($user_list[$key]['ownBooklet'])) {
            $user_list[$key]['nb_booklets'] = count($user_list[$key]['ownBooklet']);
            unset($user_list[$key]['ownBooklet']);
        } else {
            $user_list[$key]['nb_booklets'] = 0;
        }
        if (isset($user_list[$key]['ownLibrary'])) {
            unset($user_list[$key]['ownLibrary']);
        }
    }
    echo json_encode($user_list);
});
// REST Api admin get user export
$app->get('/admin/users/export', function() use ($app) {
    // retrieve user
    $user_record = retrieveAdminByToken();
    if (!$user_record) {
        return;
    }
    exportUsers();
});
// REST Api admin delete user
$app->delete('/admin/user/:user_id', function($user_id) use ($app) {
    // retrieve user
    $user_record = retrieveAdminByToken();
    if (!$user_record) {
        return;
    }
    $user = R::findOne('user', 'id=?', array($user_id));
    if (is_null($user)) {
        $app->response()->status(404);
        return;
    }
    // check if user is admin
    if (intval($user->permissions) === 2) {
        $app->response()->status(403);
        return;
    }
    // delete library
    foreach ($user->xownLibraryList as $image) {
        // remove file
        @unlink('..' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'uploaded' . DIRECTORY_SEPARATOR . $image->filename);
    }
    R::trash($user);
});
// REST Api admin create faq
$app->post('/admin/faq', function() use ($app) {
    // retrieve user
    $user_record = retrieveAdminByToken();
    if (!$user_record) {
        return;
    }
    // get data
    $postData = json_decode($app->request->getBody(), true);
    if (!key_exists('ask', $postData) || is_null($postData['ask']) || !key_exists('answer', $postData) || is_null($postData['answer'])) {
        // bad params
        $app->response()->status(400);
        return;
    }
    $faq_record = R::dispense('faq');
    $faq_record->ask = $postData['ask'];
    $faq_record->answer = $postData['answer'];
    R::store($faq_record);
});
// REST Api admin update faq
$app->put('/admin/faq/:faq_id', function($faq_id) use ($app) {
    // retrieve user
    $user_record = retrieveAdminByToken();
    if (!$user_record) {
        return;
    }
    // get data
    $putData = json_decode($app->request->getBody(), true);
     if (!key_exists('ask', $putData) || is_null($putData['ask']) || !key_exists('answer', $putData) || is_null($putData['answer'])) {
        // bad params
        $app->response()->status(400);
        return;
    }
    // retrieve faq
    $faq_record = R::load('faq', $faq_id);
    if (is_null($faq_record)) {
        $app->response()->status(404);
        return;
    }
    $faq_record->ask = $putData['ask'];
    $faq_record->answer = $putData['answer'];
    R::store($faq_record);
});
// REST Api admin delete faq
$app->delete('/admin/faq/:faq_id', function($faq_id) use ($app) {
    // retrieve user
    $user_record = retrieveAdminByToken();
    if (!$user_record) {
        return;
    }
    // retrieve faq
    $faq_record = R::load('faq', $faq_id);
    if (is_null($faq_record)) {
        $app->response()->status(404);
        return;
    }
    R::trash($faq_record);
});
// REST Api admin update folio template help
$app->put('/admin/template/:tpl_id/help', function($tpl_id) use ($app) {
    // retrieve user
    $user_record = retrieveAdminByToken();
    if (!$user_record) {
        return;
    }
    // get data
    $putData = json_decode($app->request->getBody(), true);
     if (!key_exists('intro', $putData) || is_null($putData['intro']) || !key_exists('text', $putData) || is_null($putData['text'])) {
        // bad params
        $app->response()->status(400);
        return;
    }
    // retrieve folio template
    $tpl_record = R::load('templatefolio', $tpl_id);
    if (is_null($tpl_record)) {
        $app->response()->status(404);
        return;
    }
    $tpl_record->helpintro = $putData['intro'];
    $tpl_record->helptext = $putData['text'];
    R::store($tpl_record);
});

/*
 * 
 * API Faq
 * 
 */
$app->get('/faq', function() use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
    $faq_record = R::findAll('faq');
    echo json_encode(R::exportAll($faq_record));
});


/*
 * 
 * INIT APP (TEMPLATES)
 * 
 */
// REST Api template init
$app->get('/templates/init', function() use ($app) {
    R::trashAll(R::findAll('templatepage'));
    R::trashAll(R::findAll('templatefolio'));
    $templates_path = '..' . DIRECTORY_SEPARATOR . 'partials' . DIRECTORY_SEPARATOR . 'templates' . DIRECTORY_SEPARATOR;
    $handle = opendir($templates_path);
    while (false !== ($folio = readdir($handle))) {
        if ($folio != "." && $folio != "..") {
            if (is_dir($templates_path . $folio)) {
                $handle_folio = opendir($templates_path . $folio);
                $template_folio_record = R::dispense('templatefolio');
                $template_folio_record->type = $folio;
                $template_folio_record->helpintro = ' ';
                $template_folio_record->helptext = ' ';
                switch ($folio) {
                    case 'pochette':
                        $template_folio_record->title = 'Pochette';
                        break;
                    case 'territoire1':
                        $template_folio_record->title = 'Présentation du territoire (A)';
                        break;
                    case 'territoire2':
                        $template_folio_record->title = 'Présentation du territoire (B)';
                        break;
                    case 'territoire3':
                        $template_folio_record->title = 'Présentation du territoire (C)';
                        break;
                    case 'locale':
                        $template_folio_record->title = 'Offre locale';
                        break;
                    case 'ensemble':
                        $template_folio_record->title = 'Bien vivre ensemble';
                        break;
                    case 'agenda':
                        $template_folio_record->title = 'Agenda';
                        break;
                    default:
                        $template_folio_record->title = 'Folio';
                }
                $template_folio_record->xownTemplatepageList = array();
                $pages = array();
                while (false !== ($page = readdir($handle_folio))) {
                    if ($page != "." && $page != "..") {
                        $pages[] = $page;
                    }
                }
                asort($pages);
                foreach ($pages as $page) {
                    $content = file_get_contents($templates_path . $folio . DIRECTORY_SEPARATOR . $page);
                    $template_page_record = R::dispense('templatepage');
                    $template_page_record->order = basename($page, '.html');
                    $template_page_record->content = $content;
                    $template_folio_record->xownTemplatepageList[] = $template_page_record;
                }
                R::store($template_folio_record);
                closedir($handle_folio);
            }
        }
    }
    closedir($handle);
});

// REST Api get folio templates
$app->get('/templates/folios', function() use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
    // retrieve folio templates
    $template_folio_record = R::findAll('templatefolio');
    if (is_null($template_folio_record)) {
        // no folio templates found
        $app->response()->status(404);
        return;
    }
    $results = R::exportAll($template_folio_record);
    $data = array();
    foreach ($results as $res) {
        unset($res['ownTemplatepage']);
        $data[$res['type']] = $res;
    }
    echo json_encode($data);
});

// REST Api library categories init
$app->get('/library/init', function() use ($app) {
    $categories = array(
        'Accompagnement social',
        'Accueillir',
        'Agir',
        'Commerces',
        'Culture',
        'Culture tourisme',
        'Déchets',
        'Découvrir',
        'Etablissements scolaires - Formation',
        'Périscolaire',
        'Petite enfance',
        'Santé',
        'Scolarité',
        'Services administratifs',
        'Services marchands',
        'Sport',
        'Structures d’accueil périscolaire',
        'Tourisme',
        'Transport',
        'Vivre ensemble'
    );
    R::trashAll(R::findAll('librarycategory'));
    foreach ($categories as $cat) {
        $library_category_record = R::dispense('librarycategory');
        $library_category_record->name = $cat;
        $library_category_record->ownLibraryList = array();
        R::store($library_category_record);
    }
});


// run REST Api
$app->run();
R::close();
