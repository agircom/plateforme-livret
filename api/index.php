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
    sendContactEmail($mail_data, $givenContactInfos);
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
$app->get('/booklet/:booklet_id/folio/:folio_id/export', function($booklet_id, $folio_id) use ($app) {
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
    $mpdf = new mPDF('utf-8', $format);
    $stylesheet = file_get_contents('..' . DIRECTORY_SEPARATOR . 'css' . DIRECTORY_SEPARATOR . 'styles_pdf.css');
    $mpdf->WriteHTML($stylesheet,1);
    $mpdf->WriteHTML('<div class="cadre-folio-pf">', 2, true, false);
    foreach ($folio_record->xownPageList as $page) {
        $content = preg_replace('/<img src\=\"([^\"]*)\"/', "<img src=\"../$1\"", $page->content);
        $mpdf->WriteHTML($content);
        if ($page->id !== end($folio_record->xownPageList)->id) {
            $mpdf->AddPage();
        }
    }
    $mpdf->WriteHTML('</div>', 2, false, true);
//    $mpdf->SetDisplayMode(90);
    $mpdf->debug = true;
    $mpdf->showImageErrors = true;
    $mpdf->Output('livret.pdf', 'D');
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
    echo json_encode($data, JSON_NUMERIC_CHECK);
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

// REST Api delete user library image
$app->delete('/library/:image_id', function($image_id) use ($app) {
    // retrieve user
    $user_record = retrieveUserByToken();
    if (!$user_record) {
        return;
    }
    // retrieve library item
    if (!isset($user_record->xownLibraryList[$image_id])) {
        // library item doesn't exist or is not the owner
        $app->response()->status(404);
        return;
    }
    // remove file
    @unlink('..' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'uploaded' . DIRECTORY_SEPARATOR . $user_record->xownLibraryList[$image_id]->filename);
    // delete the library item
    unset($user_record->xownLibraryList[$image_id]);
    R::store($user_record);
});



/*
 * 
 * API Admin
 * 
 */
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
    // delete library
    foreach ($user->xownLibraryList as $image) {
        // remove file
        unlink('..' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'uploaded' . DIRECTORY_SEPARATOR . $image->filename);
    }
    R::trash($user);
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
                $template_folio_record->xownTemplatepageList = array();
                while (false !== ($page = readdir($handle_folio))) {
                    if ($page != "." && $page != "..") {
                        $content = file_get_contents($templates_path . $folio . DIRECTORY_SEPARATOR . $page);
                        $template_page_record = R::dispense('templatepage');
                        $template_page_record->order = basename($page, '.html');
                        $template_page_record->content = $content;
                        $template_folio_record->xownTemplatepageList[] = $template_page_record;
                    }
                }
                R::store($template_folio_record);
                closedir($handle_folio);
            }
        }
    }
    closedir($handle);
});



// run REST Api
$app->run();
R::close();
