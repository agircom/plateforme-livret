<?php

return array(
    'app' => array(
        'salt' => '!P10p&42!'
    ),
    'bdd' => array(

        'host' => 'localhost',
        'name' => 'livretac',
        'user' => 'root',
        'passwd' => ''
    ),
    'smtp' => array(
//        'host' => 'SSL0.OVH.NET',
        'host' => 'smtp.livret-accueil-haute-normandie.fr',
        'port' => 587,
        'auth' => true,
        'user' => 'plateforme@livret-accueil-haute-normandie.fr',
        'passwd' => '4x8Fvm4J',
        'secure' => 'ssl',
        'debug' => 0,
        'from' => 'plateforme@livret-accueil-haute-normandie.fr',
        'from_name' => 'Plateforme livret d\'accueil'
    )
);
