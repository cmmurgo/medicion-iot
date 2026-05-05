<?php

namespace app\controllers;

use yii\rest\ActiveController;
use yii\web\Response;
use yii\filters\Cors;
use Yii;

class LayoutController extends ActiveController
{
    public $modelClass = 'app\models\Layout';

    public function behaviors()
    {
        $behaviors = parent::behaviors();
        $behaviors['corsFilter'] = [
            'class' => Cors::class,
        ];
        return $behaviors;
    }

    public function actionByTenant($tenantId)
    {
        return \app\models\Layout::find()->where(['tenant_id' => $tenantId])->all();
    }
}
