<?php

namespace app\models;

use yii\db\ActiveRecord;

/**
 * This is the model class for table "tenants".
 *
 * @property int $id
 * @property string $name
 * @property string|null $domain
 * @property string $created_at
 */
class Tenant extends ActiveRecord
{
    public static function tableName()
    {
        return 'tenants';
    }

    public function rules()
    {
        return [
            [['name'], 'required'],
            [['created_at'], 'safe'],
            [['name', 'domain'], 'string', 'max' => 255],
            [['domain'], 'unique'],
        ];
    }

    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'name' => 'Name',
            'domain' => 'Domain',
            'created_at' => 'Created At',
        ];
    }

    public function getLayouts()
    {
        return $this->hasMany(Layout::class, ['tenant_id' => 'id']);
    }

    public function getSensors()
    {
        return $this->hasMany(Sensor::class, ['tenant_id' => 'id']);
    }
}
