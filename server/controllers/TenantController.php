<?php

namespace app\controllers;

use yii\rest\ActiveController;
use yii\filters\Cors;

class TenantController extends ActiveController
{
    public $modelClass = 'app\models\Tenant';

    public function behaviors()
    {
        $behaviors = parent::behaviors();
        $behaviors['corsFilter'] = [
            'class' => Cors::class,
        ];
        return $behaviors;
    }
}
